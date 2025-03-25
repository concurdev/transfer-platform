class UserBalance {
  constructor(public userAddress: string, public tokenAddress: string, public balance: number) {}

  public hasEnoughBalance(amount: number): boolean {
    return this.balance >= amount;
  }
}

export default UserBalance;
