import { inngest } from "./client";


export const processWelcomeWorkflow = inngest.createFunction(
  { id: "welcome-workflow",
    name : 'user/signup',
    triggers:[{
        event:"user/signup",
        
    }]
  },
  async ({ event, step }) => {

    await step.run("save-user", async () => {
      console.log(`💾 [DB]: Saving ${event.data.email} to the database...`);
    });


    await step.sleep("delay-welcome", "3s");


    await step.run("send-email", async () => {
      console.log(`Welcome email sent to ${event.data.email}!`);
    });

    return { status: "completed" };
  }
);

export const orderWorkflow = inngest.createFunction(
  { id: "order-fulfillment-workflow",
    name : 'order/placed',
    triggers:[{
        event:"order/placed",
        
    }]
   },
  async ({ event, step }) => {
    const { orderId, amount, items, userId } = event.data;

    const payment = await step.run("charge-payment", async () => {
      console.log(`Charging $${amount} for order ${orderId}`);
      return { transactionId: "ch_12345", success: true };
    });

    
    await step.run("generate-invoice", async () => {
      console.log(`Creating invoice for Tx: ${payment.transactionId}`);
    });

   
    await step.run("update-inventory", async () => {
      console.log(`Deducting ${items.length} items from warehouse stock`);
    });

    return { status: "order_fulfilled" };
  }
);


export const accountDeletionWorkflow = inngest.createFunction(
  { id: "account-deletion-workflow" ,
    name : 'user/delete.requested',
    triggers:[{
        event:"user/delete.requested",
        
    }]
  },
  async ({ event, step }) => {
    const { userId, email } = event.data;


    await step.run("send-verification-email", async () => {
      console.log(`Deletion link emailed to ${email}`);
    });

    const confirmedEvent = await step.waitForEvent("wait-for-user-confirmation", {
      event: "user/delete.confirmed",
      timeout: "1m", 
      match: "data.userId", 
    });

    if (confirmedEvent) {
      await step.run("delete-from-database", async () => {
        console.log(`Account ${userId} permanently erased.`);
      });
      return { result: "deleted" };
    } else {
    
      await step.run("cancel-deletion-request", async () => {
        console.log(`❌ Deletion request expired for ${userId}. Account safe.`);
      });
      return { result: "expired" };
    }
  }
);