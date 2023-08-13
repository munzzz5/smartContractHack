const {
  Client,
  ContractExecuteTransaction,
  ContractFunctionParameters,
  ContractCallQuery,
  Hbar,
  PrivateKey,
} = require("@hashgraph/sdk");
// const query = new ContractCallQuery()
//   .setContractId("0.0.476227")
//   .setFunction(
//     "balanceOf",
//     new ContractFunctionParameters().addAddress(address(0))
//   )
//   .setGas(100000)
//   .setQueryPayment(new Hbar(2));

// const response = await query.execute(client);
// const balance = response.getInt256(0); // Assuming the balance is returned as an int64
// console.log("Balance of address", address(0), "is", balance);
// =====
const client = Client.forTestnet();
const privateKeyStr =
  "3030020100300706052b8104000a04220420ecaf2dc856896c74beda53ccbc1326462e436c2b64c256f4bab0885355604ba9";
const accountIdStr = "0.0.1545";

const privateKey = PrivateKey.fromString(privateKeyStr);
// const client = Client.forTestnet();
client.setOperator(accountIdStr, privateKey);

async function checkBalance() {
  const query = new ContractCallQuery()
    .setContractId("0.0.476227")
    .setFunction(
      "balanceOf",
      new ContractFunctionParameters().addAddress(
        "0xBCEb2Ac0ED730eB6be1800AaCeE3F746D52094E8"
      )
    )
    .setGas(100000)
    .setQueryPayment(new Hbar(2));

  const response = await query.execute(client);
  const balance = response.getInt256(0); // Assuming the balance is returned as an int64
  console.log("Balance of address", "is", balance.toString());
}

checkBalance().catch((error) => {
  console.error("Error checking balance:", error);
});
