import { EmailService } from "./email.service";

describe("Notification email configuration", () => {
  it("fails explicitly instead of acknowledging an unsent queued email", async () => {
    const service = new EmailService({ brevo: undefined } as never);
    await expect(
      service.send(
        {
          to: [{ email: "fixture@example.test" }],
          subject: "Activity",
          text: "Open your inbox",
        },
        { requireConfigured: true },
      ),
    ).rejects.toThrow("Notification email delivery requires Brevo configuration");
  });
});
