import { serve } from 'inngest/next';
import { inngest } from '../../inngest/client';
import { accountDeletionWorkflow, orderWorkflow, processWelcomeWorkflow } from '../../inngest/functions';

export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [
        processWelcomeWorkflow,
        orderWorkflow,
        accountDeletionWorkflow
    ]
})