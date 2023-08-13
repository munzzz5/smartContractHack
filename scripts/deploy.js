const {
  Client,
  FileCreateTransaction,
  ContractCreateFlow,
  ContractExecuteTransaction,
  ContractFunctionParameters,
  Hbar,
  PrivateKey,
} = require("@hashgraph/sdk");
const fs = require("fs");
const path = require("path");

// console.log("__dirname", __dirname);
const loadContractData = (contractName) => {
  const abiPath = path.resolve(__dirname, "..", "build", `${contractName}.abi`);
  const binPath = path.resolve(__dirname, "..", "build", `${contractName}.bin`);

  const abi = JSON.parse(fs.readFileSync(abiPath, "utf8"));
  const bin = fs.readFileSync(binPath, "utf8");
  return { abi, bin };
};
const NonTransferableToken = loadContractData("NonTransferableToken");
const PPA = loadContractData("PPA");
// const NonTransferableToken = require("../build/NonTransferableToken.json");
// const PPA = require("../build/PPA.json");

// Initialize the client
const client = Client.forTestnet();
const privateKeyStr =
  "3030020100300706052b8104000a04220420ecaf2dc856896c74beda53ccbc1326462e436c2b64c256f4bab0885355604ba9";
const accountIdStr = "0.0.1545";

const privateKey = PrivateKey.fromString(privateKeyStr);
// const client = Client.forTestnet();
client.setOperator(accountIdStr, privateKey);

// Deploy the NonTransferableToken contract
const deployNonTransferableToken = async () => {
  const bytecode = NonTransferableToken.bin;

  const fileCreateTx = new FileCreateTransaction().setContents(bytecode);

  const submitTx = await fileCreateTx.execute(client);
  const fileReceipt = await submitTx.getReceipt(client);
  const bytecodeFileId = fileReceipt.fileId;

  const contractTx = new ContractCreateFlow()
    .setBytecode(bytecode)
    .setGas(200000);

  const contractResponse = await contractTx.execute(client);
  const contractReceipt = await contractResponse.getReceipt(client);
  const nttContractId = contractReceipt.contractId;

  console.log("The NonTransferableToken contract ID is", nttContractId);
  return nttContractId;
};

// Deploy the PPA contract
const deployPPA = async (nttContractId) => {
  const bytecode = PPA.bin;

  const fileCreateTx = new FileCreateTransaction().setContents(bytecode);

  const submitTx = await fileCreateTx.execute(client);
  const fileReceipt = await submitTx.getReceipt(client);
  const bytecodeFileId = fileReceipt.fileId;

  const contractTx = new ContractCreateFlow()
    .setBytecode(bytecode)
    .setGas(200000)
    .setConstructorParameters(
      new ContractFunctionParameters()
        .addString(nttContractId)
        .addAddress(generatorAddress)
        .addAddress(consumerAddress)
        .addUint256(minGenerationValue)
        .addUint256(minConsumptionValue)
    );

  const contractResponse = await contractTx.execute(client);
  const contractReceipt = await contractResponse.getReceipt(client);
  const ppaContractId = contractReceipt.contractId;

  console.log("The PPA contract ID is", ppaContractId);
  return ppaContractId;
};

// Main deployment function
const deployContracts = async () => {
  const nttContractId = await deployNonTransferableToken();
  await deployPPA(nttContractId);
};

deployContracts().catch((err) => {
  console.error("Error deploying contracts:", err);
});
