const {
  Client,
  ContractExecuteTransaction,
  ContractFunctionParameters,
  Hbar,
  PrivateKey,
} = require("@hashgraph/sdk");

async function assignTokenToAddress(contractId, recipientAddress) {
  const client = Client.forTestnet();
  client.setOperator(
    "0.0.1545",
    PrivateKey.fromString(
      "3030020100300706052b8104000a04220420ecaf2dc856896c74beda53ccbc1326462e436c2b64c256f4bab0885355604ba9"
    )
  ); // Set your account ID and private key

  const callTransaction = new ContractExecuteTransaction()
    .setContractId("0.0.476227")
    .setGas(450000) // Set an appropriate gas limit
    .setFunction(
      "mintAndAssign",
      new ContractFunctionParameters()
        .addAddress("0xBCEb2Ac0ED730eB6be1800AaCeE3F746D52094E8")
        .addUint256(1)
    )
    .setMaxTransactionFee(new Hbar(5)); // Set a max transaction fee

  const response = await callTransaction.execute(client);
  const receipt = await response.getReceipt(client);

  if (receipt.status.toString() !== "SUCCESS") {
    console.error("Error calling contract:", receipt.status.toString());
  } else {
    console.log("Token assigned successfully!");
  }
}

const contractId = "0.0.476235"; // Replace with your contract's ID
const recipientAddress = "0xBCEb2Ac0ED730eB6be1800AaCeE3F746D52094E8"; // Replace with the recipient's address
assignTokenToAddress(contractId, recipientAddress);
