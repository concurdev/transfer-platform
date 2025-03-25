import { Logger } from "../utils/logger";

class SolverService {
  private logger = Logger.getInstance();

  public async executeTransfer(transferId: string, sender: string, amount: number) {
    this.logger.info(`Solver processing transfer ${transferId} for ${sender}, amount: ${amount}`);

    // Simulate market maker execution delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Randomly decide if execution is successful or not
    const isSuccess = Math.random() > 0.2; // 80% success rate

    if (isSuccess) {
      this.logger.info(`Transfer ${transferId} executed successfully.`);
      return { success: true };
    } else {
      this.logger.warn(`Transfer ${transferId} execution failed.`);
      return { success: false };
    }
  }

  public async executeRefund(transferId: string, chainId: number, refundAmount: number) {
    this.logger.info(`Refund processing for transferId: ${transferId} on chainId: ${chainId}, amount: ${refundAmount}`);

    // Simulate refund execution delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Randomly decide if refund is successful or not
    const isSuccess = Math.random() > 0.2; // 80% success rate

    if (isSuccess) {
      this.logger.info(`Refund for transferId: ${transferId} executed successfully.`);
      return { success: true };
    } else {
      this.logger.warn(`Refund for transferId: ${transferId} execution failed.`);
      return { success: false };
    }
  }
}

export default new SolverService();
