// Using example from aws-cdk repository: https://github.com/aws-samples/aws-cdk-examples/blob/master/typescript/static-site/static-site.ts
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as cloudfront_origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { CfnOutput, Duration, RemovalPolicy, Stack } from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface StaticSiteProps {
	domainName: string;
	subdomainName: string;
	filePath: string;
	/** Origin(s) allowed in CSP connect-src, e.g. API Gateway URL */
	apiConnectSrc?: string[];
}

/**
 * Static site infrastructure, which deploys site content to an S3 bucket.
 *
 * The site redirects from HTTP to HTTPS, using a CloudFront distribution,
 * Route53 alias record, and ACM certificate.
 */
export class StaticSite extends Construct {
	constructor(parent: Stack, name: string, props: StaticSiteProps) {
		super(parent, name);

		const zone = route53.HostedZone.fromLookup(this, 'Zone', { domainName: props.domainName });
		const siteDomain = `${props.subdomainName}.${props.domainName}`;
		const cloudfrontOAI = new cloudfront.OriginAccessIdentity(this, 'cloudfront-OAI', {
			comment: `OAI for ${name}`
		});

		new CfnOutput(this, 'Site', { value: `https://${siteDomain}` });

		const siteBucket = new s3.Bucket(this, 'SiteBucket', {
			bucketName: siteDomain,
			publicReadAccess: false,
			blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
			removalPolicy: RemovalPolicy.RETAIN,
			autoDeleteObjects: false,
			enforceSSL: true
		});

		siteBucket.addToResourcePolicy(
			new iam.PolicyStatement({
				actions: ['s3:GetObject'],
				resources: [siteBucket.arnForObjects('*')],
				principals: [
					new iam.CanonicalUserPrincipal(
						cloudfrontOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId
					)
				]
			})
		);
		new CfnOutput(this, 'Bucket', { value: siteBucket.bucketName });

		const certificate = new acm.Certificate(this, 'SiteCertificate', {
			domainName: siteDomain,
			validation: acm.CertificateValidation.fromDns(zone)
		});

		new CfnOutput(this, 'Certificate', { value: certificate.certificateArn });

		const apiConnect = (props.apiConnectSrc ?? []).join(' ');
		const csp = [
			"default-src 'self'",
			"base-uri 'self'",
			"object-src 'none'",
			"frame-ancestors 'none'",
			"form-action 'self'",
			"img-src 'self' data: https://*.googleusercontent.com",
			"font-src 'self' https://fonts.gstatic.com",
			"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
			"script-src 'self' https://accounts.google.com",
			"frame-src https://accounts.google.com",
			`connect-src 'self' https://accounts.google.com https://oauth2.googleapis.com https://www.googleapis.com${
				apiConnect ? ` ${apiConnect}` : ''
			}`,
			'upgrade-insecure-requests'
		].join('; ');

		const responseHeadersPolicy = new cloudfront.ResponseHeadersPolicy(
			this,
			'SecurityHeadersPolicy',
			{
				comment: `Security headers for ${siteDomain}`,
				securityHeadersBehavior: {
					contentSecurityPolicy: {
						contentSecurityPolicy: csp,
						override: true
					},
					contentTypeOptions: { override: true },
					frameOptions: {
						frameOption: cloudfront.HeadersFrameOption.DENY,
						override: true
					},
					referrerPolicy: {
						referrerPolicy: cloudfront.HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN,
						override: true
					},
					strictTransportSecurity: {
						accessControlMaxAge: Duration.days(365),
						includeSubdomains: true,
						preload: true,
						override: true
					},
					xssProtection: {
						protection: true,
						modeBlock: true,
						override: true
					}
				},
				customHeadersBehavior: {
					customHeaders: [
						{
							header: 'Permissions-Policy',
							value: 'camera=(), microphone=(), geolocation=(), payment=()',
							override: true
						}
					]
				}
			}
		);

		const distribution = new cloudfront.Distribution(this, 'SiteDistribution', {
			certificate: certificate,
			defaultRootObject: 'index.html',
			domainNames: [siteDomain],
			minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
			errorResponses: [
				{
					httpStatus: 403,
					responseHttpStatus: 200,
					responsePagePath: '/index.html',
					ttl: Duration.minutes(5)
				},
				{
					httpStatus: 404,
					responseHttpStatus: 200,
					responsePagePath: '/index.html',
					ttl: Duration.minutes(5)
				}
			],
			defaultBehavior: {
				origin: new cloudfront_origins.S3Origin(siteBucket, {
					originAccessIdentity: cloudfrontOAI
				}),
				compress: true,
				allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
				viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
				responseHeadersPolicy
			}
		});

		new CfnOutput(this, 'DistributionId', { value: distribution.distributionId });

		new route53.ARecord(this, 'SiteAliasRecord', {
			recordName: siteDomain,
			target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
			zone
		});

		new s3deploy.BucketDeployment(this, 'DeployWithInvalidation', {
			sources: [s3deploy.Source.asset(props.filePath)],
			destinationBucket: siteBucket,
			distribution,
			distributionPaths: ['/*']
		});
	}
}
