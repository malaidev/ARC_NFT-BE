import json
from typing import Any, Dict, Optional

from aws_cdk import core
from aws_cdk import aws_ecr as ecr
from aws_cdk import aws_eks as eks
from aws_cdk import aws_ssm as ssm
from aws_cdk import aws_route53 as route53
from aws_cdk import aws_certificatemanager as cm


class Stack(core.Stack):
    def __init__(self, scope: core.Construct, id: str, props: Dict, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        self.namespace = props["namespace"].lower()

        with open("package.json", "r") as f:
            package_json = json.load(f)
        
        self.version = package_json.get("version")

        if self.version is None:
            raise ValueError("Version must be defined in the `package.json` file")

        hosted_zone = route53.HostedZone.from_hosted_zone_attributes(
            self,
            "HostedZone",
            hosted_zone_id="Z03693222PH960ZUMVX4R",
            zone_name="api.arc.market",
        )

        domain = "development.api.arc.market"

        # ACM
        certificate = cm.Certificate(
            self,
            "Certificate",
            domain_name=domain,
            validation=cm.CertificateValidation.from_dns(hosted_zone=hosted_zone),
        )

        eks_cluster = eks.Cluster.from_cluster_attributes(
            self,
            "k8sCluster",
            cluster_name=ssm.StringParameter.from_string_parameter_name(
                self,
                "ClusterName",
                string_parameter_name="/depo/depo-k8s/cluster-name/staging",
            ).string_value,
            kubectl_role_arn=ssm.StringParameter.from_string_parameter_name(
                self,
                "KubectlRoleARN",
                string_parameter_name="/depo/depo-k8s/kubectl-role-arn/staging",
            ).string_value,
        )

        # ECR repository
        repository = ecr.Repository.from_repository_name(
            self, "Repository", repository_name=props["namespace"]
        )

        # API manifest
        api_deployment = {
            "apiVersion": "apps/v1",
            "kind": "Deployment",
            "metadata": {"name": f"{props['namespace']}-deployment"},
            "spec": {
                "selector": {"matchLabels": {"app.kubernetes.io/name": f"{props['namespace']}-app"}},
                "replicas": 5,
                "template": {
                    "metadata": {"labels": {"app.kubernetes.io/name": f"{props['namespace']}-app"}},
                    "spec": {
                        "containers": [
                            {
                                "image": repository.repository_uri_for_tag(self.version),
                                "imagePullPolicy": "Always",
                                "name": props["namespace"],
                                "ports": [{"containerPort": 3001}],
                                # "command": ["npm", "start"],
                                "command": ["ts-node", "-r", "esm", "server.ts"],
                                "envFrom": [{"secretRef": {"name": "kucoin-creds"}}],
                                "env": [
                                    {
                                        "name": "ENV",
                                        "value": "staging"
                                    },
                                    {
                                        "name": "MONGODB_USER",
                                        "valueFrom": {
                                            "secretKeyRef": {"name": "mongo-creds", "key": "username"}
                                        },
                                    },
                                    {
                                        "name": "MONGODB_PASSWORD",
                                        "valueFrom": {
                                            "secretKeyRef": {"name": "mongo-creds", "key": "password"}
                                        },
                                    },
                                    {
                                        "name": "MONGODB_PORT",
                                        "valueFrom": {
                                            "secretKeyRef": {"name": "mongo-creds", "key": "port"}
                                        },
                                    },
                                    {
                                        "name": "MONGODB_HOST",
                                        "valueFrom": {
                                            "secretKeyRef": {"name": "mongo-creds", "key": "host"}
                                        },
                                    },
                                    {
                                        "name": "MONGODB_SCHEMA",
                                        "valueFrom": {
                                            "secretKeyRef": {"name": "mongo-creds", "key": "schema"}
                                        },
                                    },
                                    {
                                        "name": "JWT_SECRET",
                                        "valueFrom": {
                                            "secretKeyRef": {"name": "auth", "key": "jwt_secret"}
                                        },
                                    },
                                    {
                                        "name": "EMAIL_SERVICE_API_KEY",
                                        "valueFrom": {
                                            "secretKeyRef": {"name": "email", "key": "service_api_key"}
                                        },
                                    },
                                    {
                                        "name": "EMAIL_SERVICE_DOMAIN",
                                        "valueFrom": {
                                            "secretKeyRef": {"name": "email", "key": "service_domain"}
                                        },
                                    },
                                    {
                                        "name": "LOGGING",
                                        "valueFrom": {
                                            "secretKeyRef": {"name": "logging", "key": "logging"}
                                        },
                                    },
                                    {
                                        "name": "CONTRACT_PRIVATE_KEY",
                                        "valueFrom": {
                                            "secretKeyRef": {"name": "contracts", "key": "private_key"}
                                        },
                                    },
                                    {
                                        "name": "CONTRACT_DEPO_TOKEN_ADDRESS",
                                        "valueFrom": {
                                            "secretKeyRef": {"name": "contracts", "key": "depo_token_address"}
                                        },
                                    },
                                    {
                                        "name": "CONTRACT_PAYMENT_MODULE_ADDRESS",
                                        "valueFrom": {
                                            "secretKeyRef": {"name": "contracts", "key": "payment_module_address"}
                                        },
                                    },
                                    {
                                        "name": "CONTRACT_PK_ID",
                                        "valueFrom": {
                                            "secretKeyRef": {"name": "contracts", "key": "pk_id"}
                                        },
                                    },                                     
                                    {
                                        "name": "NFT_PRIVATE_KEY",
                                        "valueFrom": {
                                            "secretKeyRef": {"name": "contracts", "key": "nft_private_key"}
                                        },
                                    },
                                    {
                                        "name": "NFT_PURCHASE_MODULE_ADDRESS",
                                        "valueFrom": {
                                            "secretKeyRef": {"name": "contracts", "key": "nft_purchase_address"}
                                        },
                                    },
                                    {
                                        "name": "NFT_PK_ID",
                                        "valueFrom": {
                                            "secretKeyRef": {"name": "contracts", "key": "nft_pkid"}
                                        },
                                    },
                                    {
                                        "name": "AWS_S3_KEY",
                                        "valueFrom": {
                                            "secretKeyRef": {"name": "s3profile", "key": "aws_s3profile_key"}
                                        },
                                    },
                                    {
                                        "name": "AWS_S3_SECRET",
                                        "valueFrom": {
                                            "secretKeyRef": {"name": "s3profile", "key": "aws_s3profile_secret"}
                                        },
                                    },
                                    {
                                        "name": "AWS_S3_USER_BUCKET",
                                        "valueFrom": {
                                            "secretKeyRef": {"name": "s3profile", "key": "aws_s3profile_bucket"}
                                        },
                                    },
                                    {
                                        "name": "MORALIS_URL",
                                        "valueFrom": {
                                            "secretKeyRef": {"name": "moralis", "key": "moralis_url"}
                                        },
                                    },
                                    {
                                        "name": "MORALIS_APPID",
                                        "valueFrom": {
                                            "secretKeyRef": {"name": "moralis", "key": "moralis_appid"}
                                        },
                                    },                                    
                                    {
                                        "name": "MORALIS_MASTER_KEY",
                                        "valueFrom": {
                                            "secretKeyRef": {"name": "moralis", "key": "moralis_masterkey"}
                                        },
                                    },
                                    {
                                        "name": "OPENSEA_KEY",
                                        "valueFrom": {
                                            "secretKeyRef": {"name": "opensea", "key": "opensea_key"}
                                        },
                                    },
                                    {
                                        "name": "OPENSEA_ADDR",
                                        "valueFrom": {
                                            "secretKeyRef": {"name": "opensea", "key": "opensea_addr"}
                                        },
                                    },                                    
                                    {
                                        "name": "GOOGLE_RECAPTCHA",
                                        "valueFrom": {
                                            "secretKeyRef": {"name": "recaptcha", "key": "server"}
                                        },
                                    },
                                    {
                                        "name": "GOOGLE_SITE_VERIFY",
                                        "valueFrom": {
                                            "secretKeyRef": {"name": "recaptcha", "key": "urlVerification"}
                                        },
                                    },
                                    {
                                        "name": "MAIL_USER",
                                        "valueFrom": {
                                            "secretKeyRef": {"name": "mailauth", "key": "user"}
                                        },
                                    },
                                    {
                                        "name": "MAIL_PASS",
                                        "valueFrom": {
                                            "secretKeyRef": {"name": "mailauth", "key": "pass"}
                                        },
                                    }, 
                                ],
                            }
                        ]
                    },
                },
            },
        }

        api_service = {
            "apiVersion": "v1",
            "kind": "Service",
            "metadata": {"name": f"{props['namespace']}-service"},
            "spec": {
                "ports": [{"port": 80, "targetPort": 3001, "protocol": "TCP"}],
                "type": "NodePort",
                "selector": {"app.kubernetes.io/name": f"{props['namespace']}-app"},
            },
        }

        api_ingress = {
            "apiVersion": "networking.k8s.io/v1beta1",
            "kind": "Ingress",
            "metadata": {
                "name": f"{props['namespace']}-ingress",
                "annotations": {
                    "kubernetes.io/ingress.class": "alb",
                    "alb.ingress.kubernetes.io/load-balancer-name": self.give_name("alb"),
                    "alb.ingress.kubernetes.io/scheme": "internet-facing",
                    "alb.ingress.kubernetes.io/target-type": "ip",
                    "alb.ingress.kubernetes.io/listen-ports": '[{"HTTP": 80}, {"HTTPS": 443}]',
                    "alb.ingress.kubernetes.io/healthcheck-path": "/",
                    "alb.ingress.kubernetes.io/success-codes": '204',
                    "alb.ingress.kubernetes.io/certificate-arn": certificate.certificate_arn,
                    "external-dns.alpha.kubernetes.io/hostname": domain,
                    "alb.ingress.kubernetes.io/actions.ssl-redirect": json.dumps(
                        {
                            "Type": "redirect",
                            "RedirectConfig": {
                                "Protocol": "HTTPS",
                                "Port": "443",
                                "StatusCode": "HTTP_301",
                            },
                        }
                    ),
                },
            },
            "spec": {
                "rules": [
                    {
                        "http": {
                            "paths": [
                                {
                                    "path": "/*",
                                    "backend": {
                                        "serviceName": "ssl-redirect",
                                        "servicePort": "use-annotation",
                                    },
                                },
                                {
                                    "path": "/*",
                                    "backend": {
                                        "serviceName": f"{props['namespace']}-service",
                                        "servicePort": 80,
                                    },
                                },
                            ]
                        }
                    }
                ]
            },
        }

        eks_cluster.add_manifest("API", api_deployment)
        eks_cluster.add_manifest("Service", api_service)
        eks_cluster.add_manifest("Ingress", api_ingress)

    def give_name(self, name: str) -> str:
        return f"{self.namespace}-{name}-staging"


class Stage(core.Stage):
    def __init__(
        self,
        app: core.App,
        id: str,
        props: Dict[str, Any],
        outdir: Optional[str] = None,
        **kwargs: Any,
    ):
        super().__init__(app, id, env=kwargs.get("env"), outdir=outdir)

        Stack(self, props["namespace"], props, **kwargs)
