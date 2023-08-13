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
const ContractRequests = require("../models/ContractRequests");
const User = require("../models/User");

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
    .setGas(2000000);

  const contractResponse = await contractTx.execute(client);
  const contractReceipt = await contractResponse.getReceipt(client);
  const nttContractId = contractReceipt.contractId;

  console.log(
    "The NonTransferableToken contract ID is",
    contractResponse,
    nttContractId
  );
  return nttContractId;
};

// Deploy the PPA contract
const deployPPA = async (
  nttContractId,
  generatorAddress,
  consumerAddress,
  minConsumptionValue,
  minGenerationValue
) => {
  const bytecode = PPA.bin;

  // const fileCreateTx = new FileCreateTransaction().setContents(bytecode);

  // const submitTx = await fileCreateTx.execute(client);
  // const fileReceipt = await submitTx.getReceipt(client);
  // const bytecodeFileId = fileReceipt.fileId;

  const contractTx = new ContractCreateFlow()
    .setBytecode(bytecode)
    .setGas(2000000)
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
  const ppaContractId = await contractReceipt.contractId;

  console.log("The PPA contract ID is", ppaContractId);
  return ppaContractId;
};

// Main deployment function
const deployContracts = async (ppaRecipient) => {
  const nttContractId = await deployNonTransferableToken();
  console.log("nttContractId++++++", nttContractId);
  const nttContractObj = await ContractRequests({
    initiator: User.findOne({
      address: "0x484B40438Eae8b037481A9d6a969B2CEA8b76b3e",
    }),
    recipient: User.findOne({
      address: "0x484B40438Eae8b037481A9d6a969B2CEA8b76b3e",
    }),
    role: "Auth",
    minGuarantee: 10,
    status: "Auth",
    nttContractId: nttContractId,
  });
  nttContractObj.save();
  const contractDetail = await ContractRequests.findOne({
    status: "deployed",
    recipient: User.findOne({ address: ppaRecipient })._id,
  });
  const ppa = await deployPPA(
    "0x0000000000000000000000000000000000074443",
    // contractDetail.generatorAddress,
    "0xBCEb2Ac0ED730eB6be1800AaCeE3F746D52094E8",
    "0x484B40438Eae8b037481A9d6a969B2CEA8b76b3e",
    // contractDetail.consumerAddress,
    // contractDetail.minConsumptionValue,
    10,
    // contractDetail.minGenerationValue
    10
  );
  const contractRequest = await ContractRequests.findOneAndUpdate(
    { _id: contractDetail._id },
    { $set: { status: "deployed", ppaContractId: ppa } }
  );
};

deployContracts("0x484b40438eae8b037481a9d6a969b2cea8b76b3e").catch((err) => {
  console.error("Error deploying contracts:", err);
});
