declare module 'africastalking' {
    interface AfricasTalkingOptions {
        apiKey: string;
        username: string;
    }

    interface SmsSendOptions {
        to: string[];
        message: string;
        from?: string;
    }

    interface SmsClient {
        send(options: SmsSendOptions): Promise<unknown>;
    }

    interface AfricasTalkingClient {
        SMS: SmsClient;
    }

    function africastalking(options: AfricasTalkingOptions): AfricasTalkingClient;
    export = africastalking;
}
