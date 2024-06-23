import { deployContract, deployer, exportDeployments } from "./deploy-contract";


const deployScript = async (): Promise<void> => {
  await deployContract(
    {
      recipient: deployer.address, // the deployer address is the owner of the contract
      name: "StarkNFT",
      symbol: "SNFT",
      base_uri:
        "https://gateway.pinata.cloud/ipfs/QmZqALrmo8S6xw1fz9Xr9GrNM896enrxBHDYricBRECxFE?1",
    },
    "StarkNFT"
  );
};

deployScript()
  .then(() => {
    exportDeployments();
    console.log("All Setup Done");
  })
  .catch(console.error);
