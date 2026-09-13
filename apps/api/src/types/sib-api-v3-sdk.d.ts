declare module "sib-api-v3-sdk" {
  interface TransactionalEmailSender {
    email: string;
    name?: string;
  }

  interface TransactionalEmailRecipient {
    email: string;
    name?: string;
  }

  interface SendTransactionalEmailRequest {
    sender: TransactionalEmailSender;
    to: TransactionalEmailRecipient[];
    subject: string;
    textContent?: string;
    htmlContent?: string;
  }

  interface ApiClientInstance {
    authentications: Record<string, { apiKey?: string }>;
  }

  const SibApiV3Sdk: {
    ApiClient: { instance: ApiClientInstance };
    TransactionalEmailsApi: new () => {
      sendTransacEmail(request: SendTransactionalEmailRequest): Promise<unknown>;
    };
  };

  export default SibApiV3Sdk;
}