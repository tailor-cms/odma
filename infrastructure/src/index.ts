import * as aws from '@pulumi/aws';
import * as awsx from '@pulumi/awsx';
import * as pulumi from '@pulumi/pulumi';
import * as studion from '@studion/infra-code-blocks';

import { getEnvVariables, getSecrets } from './env';

const config = new pulumi.Config();
const dnsConfig = new pulumi.Config('dns');

const PROJECT_NAME = pulumi.getProject();
const STACK = pulumi.getStack();

const resourceNamePrefix = config.require('resourceNamePrefix');
const fullPrefix = `${resourceNamePrefix}-${STACK}`;

function buildAndPushImage() {
  const imageRepository = new aws.ecr.Repository(`${fullPrefix}-ecr`, {
    forceDelete: true,
  });
  return new awsx.ecr.Image(`${fullPrefix}-img`, {
    repositoryUrl: imageRepository.repositoryUrl,
    context: '..',
    platform: 'linux/amd64',
    args: {
      ssh: 'default',
      GITHUB_TOKEN: process.env.GITHUB_TOKEN || '',
    },
  });
}

export const dockerImage =
  process.env.APP_DOCKER_IMAGE || buildAndPushImage().imageUri;

const vpc = new awsx.ec2.Vpc(`${PROJECT_NAME}-vpc`, {
  enableDnsHostnames: true,
  numberOfAvailabilityZones: 2,
  natGateways: { strategy: 'Single' },
  subnetStrategy: 'Auto',
  subnetSpecs: [
    { type: awsx.ec2.SubnetType.Public, cidrMask: 24 },
    { type: awsx.ec2.SubnetType.Private, cidrMask: 24 },
  ],
});

const db = new studion.Database(`${fullPrefix}-odma-db`, {
  instanceClass: 'db.t4g.micro',
  dbName: 'odma',
  username: 'odma',
  vpcId: vpc.vpcId,
  vpcCidrBlock: vpc.vpc.cidrBlock,
  isolatedSubnetIds: vpc.privateSubnetIds,
});

const cluster = new aws.ecs.Cluster(`${fullPrefix}-ecs-cluster`, {
  name: `${fullPrefix}-ecs-cluster`,
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const webServer = new studion.WebServer(`${fullPrefix}-server`, {
  image: dockerImage,
  port: 3000,
  domain: dnsConfig.require('domain'),
  vpcId: vpc.vpcId,
  vpcCidrBlock: vpc.vpc.cidrBlock,
  publicSubnetIds: vpc.publicSubnetIds,
  clusterId: cluster.id,
  clusterName: cluster.name,
  hostedZoneId: dnsConfig.require('hostedZoneId'),
  autoscaling: { enabled: false },
  size: 'small',
  desiredCount: 1,
  healthCheckPath: '/api/healthcheck',
  environment: getEnvVariables(db),
  secrets: getSecrets(db),
});
