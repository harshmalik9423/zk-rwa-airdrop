console.clear();
require("dotenv").config();
const {
  AccountId,
  PrivateKey,
  Client,
  FileCreateTransaction,
  ContractCreateTransaction,
  ContractFunctionParameters,
  ContractExecuteTransaction,
  ContractCallQuery,
  Hbar,
  ContractCreateFlow,
} = require("@hashgraph/sdk");
const fs = require("fs");

// Configure accounts and client
const operatorId = AccountId.fromString(process.env.ACCOUNT_ID);
const operatorKey = PrivateKey.fromStringECDSA(process.env.ACCOUNT_KEY);

const client = Client.forTestnet().setOperator(operatorId, operatorKey);

async function main() {
  //Deploying the oracle contract
  console.log("Deploying the oracle contract");
  const oracleBytecode = fs.readFileSync(
    "zkp_contracts_TeslaOracle_sol_TeslaOracle.bin"
  );
  // Instantiate the smart contract
  const oracleContractInstantiateTx = new ContractCreateFlow()
    .setBytecode(oracleBytecode)
    .setGas(2000000)
    .setConstructorParameters(new ContractFunctionParameters().addUint256(100));
  const oracleContractInstantiateSubmit =
    await oracleContractInstantiateTx.execute(client);
  const oracleContractInstantiateRx =
    await oracleContractInstantiateSubmit.getReceipt(client);
  const oracleContractId = oracleContractInstantiateRx.contractId;
  const oracleContractAddress = oracleContractId.toSolidityAddress();
  console.log(`- The smart contract ID is: ${oracleContractId} \n`);
  console.log(
    `- The smart contract ID in Solidity format is: ${oracleContractAddress} \n`
  );

  //Deploying the ERC20 contract
  console.log("Deploying the ERC20 contract");
  const coinBytecode = fs.readFileSync("MeowCoin.bin");
  // Instantiate the smart contract
  const coinContractInstantiateTx = new ContractCreateFlow()
    .setBytecode(coinBytecode)
    .setGas(2000000);
  const coinContractInstantiateSubmit = await coinContractInstantiateTx.execute(
    client
  );
  const coinContractInstantiateRx =
    await coinContractInstantiateSubmit.getReceipt(client);
  const coinContractId = coinContractInstantiateRx.contractId;
  const coinContractAddress = coinContractId.toSolidityAddress();
  console.log(`- The smart contract ID is: ${coinContractId} \n`);
  console.log(
    `- The smart contract ID in Solidity format is: ${coinContractAddress} \n`
  );

  //Deploying the proof verifier contract
  console.log("Deploying the proof verifier contract");
  const verifierBytecode = fs.readFileSync(
    "zkp_contracts_verifiers_EquityProofVerifier_sol_EquityProofVerifier.bin"
  );
  // Instantiate the smart contract
  const verifierContractInstantiateTx = new ContractCreateFlow()
    .setBytecode(contractBytecode)
    .setGas(2000000);
  const verifierContractInstantiateSubmit =
    await verifierContractInstantiateTx.execute(client);
  const verifierContractInstantiateRx =
    await verifierContractInstantiateSubmit.getReceipt(client);
  const verifierContractId = verifierContractInstantiateRx.contractId;
  const verifierContractAddress = verifierContractId.toSolidityAddress();
  console.log(`- The smart contract ID is: ${verifierContractId} \n`);
  console.log(
    `- The smart contract ID in Solidity format is: ${verifierContractAddress} \n`
  );

  //Deploying the Airdrop contract
  const contractBytecode = fs.readFileSync("TeslaAirdrop.bin");

  // Instantiate the smart contract
  const contractInstantiateTx = new ContractCreateFlow()
    .setBytecode(contractBytecode)
    .setGas(2000000)
    .setConstructorParameters(
      new ContractFunctionParameters()
        .addAddress("0x0000000000000000000000000000000000508d1a")
        .addUint256(1000000000000000)
        .addAddress("0x0000000000000000000000000000000000508d0f")
        .addUint256(100)
        .addAddress("0x0000000000000000000000000000000000508d1f")
        .addUint256(100)
        .addUint256(2592000)
    );
  const contractInstantiateSubmit = await contractInstantiateTx.execute(client);
  const contractInstantiateRx = await contractInstantiateSubmit.getReceipt(
    client
  );
  const contractId = contractInstantiateRx.contractId;
  const contractAddress = contractId.toSolidityAddress();
  console.log(`- The smart contract ID is: ${contractId} \n`);
  console.log(
    `- The smart contract ID in Solidity format is: ${contractAddress} \n`
  );
}
main();
