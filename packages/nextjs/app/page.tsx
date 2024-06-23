"use client";

import Link from "next/link";
import type { NextPage } from "next";
import { BugAntIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Address } from "~~/components/scaffold-stark";
import { useAccount } from "@starknet-react/core";
import { Address as AddressType } from "@starknet-react/chains";
import GenericModal from "~~/components/scaffold-stark/CustomConnectButton/GenericModal";
import { useEffect, useState } from "react";
import axios from "axios";
import Image from "next/image";
import toast from "react-hot-toast";
import { Contract } from "starknet";
import { CallData } from "starknet-dev";
import abi from "../components/compiled/contract.json";
import casm from "../components/compiled/casm.json";
import { displayTxResult } from "./debug/_components/contract";
import BigNumber from "bignumber.js";

const Home: NextPage = () => {

  const connectedAddress = useAccount();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [nftName, setNftName] = useState("");

  const [nftDesc, setNftDesc] = useState("");

  const [address, setAddress] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  const [isMinting, setIsMinting] = useState(false);

  const [image, setImage] = useState("");

  const [contract, setContract] = useState("");

  const [success, setSuccess] = useState(false);

  const [nftSymbol, setNftSymbol] = useState("");

  const base = "https://starkai.cryptea.me/";

  const deployContract = async () => {
    if (isLoading) return;

    // Deploy the contract

    setIsLoading(true);

    // const dd = await connectedAddress.account?.declare({
    //    contract: {
    //     sierra_program: abi.sierra_program,
    //     abi: abi.abi,
    //     contract_class_version: abi.contract_class_version,
    //     entry_points_by_type: abi.entry_points_by_type
    //    },
    //    casm: casm,
    // });

    // console.log(dd, 'ddd')

    // return;

    try {

      const res = await axios.post(`${base}create`, {
        name: nftName,
        desc: nftDesc,
      });

      const image = `https://gateway.pinata.cloud/ipfs/${res.data.hash}?1`;

      console.log(image, "sss");

      setImage(image);

      // 0x0758e5854628069e27bc547b75c1a5aa8e24a5fccace22984183fa08199871a2
      const contractCalldata = new CallData(abi.abi);

      const constructorCalldata = contractCalldata.compile("constructor", {
        recipient: connectedAddress.address as AddressType,
        name: nftName,
        symbol: nftSymbol,
        base_uri: image,
      });

      console.log(constructorCalldata, "sss");

      const classDeploy = await connectedAddress.account?.deploy({
        classHash:
          "0x07d2fa6fb834a03ccab365379ff25b0f9b91f0eea9be115cd216f01a430e913c",
        constructorCalldata,
      });

      if (classDeploy) {
        console.log(classDeploy, "sss");

        setContract(classDeploy.contract_address[0]);

        const mres = await axios.post(`${base}ondeploy`, {
          address: connectedAddress.address,
          contract: classDeploy.contract_address[0],
          desc: nftDesc,
        });

        setIsLoading(false);

        console.log(mres, "sss");

        toast.success(
          `NFT deployed successfully 🎉  \n hash - ${classDeploy.transaction_hash}`
        );

        setIsModalOpen(false);
        setSuccess(true);
      }
    } catch (error) {
      setIsLoading(false);
      toast.error("Failed to deploy contract");
      console.log(error, "sss");
    }
  };

  const [tokenIds, setTokenIds] = useState(2);

  const mintNft = async (cnt: string, id: number, address: string) => {
    if (isMinting) return;

    const ee = toast.loading('Just a sec...')

    setIsMinting(true);

    try {
      // mint the contract
      const contract = new Contract(abi.abi, cnt, connectedAddress.account);

      const res = await contract.mint(address, id);

      console.log(res, "contract");

      await axios.post(`${base}ondeploy`, {
        address,
        contract: cnt,
        desc: nftDesc,
      });

      setIsMinting(false);

      toast.dismiss(ee);

      setAddress("");

      toast.success(`NFT minted to address successfully \n hash - ${res.transaction_hash}`);

    } catch (error) {
      toast.dismiss(ee);
      setIsMinting(false);
      toast.error("Failed to mint contract");
      console.log(error);
    }
  };

  const [nfts, setNfts] = useState<any>([]);

  const [pageLoader, setPageLoader] = useState(true);

  const [nftDx, setNftDx] = useState<any>([]);

  function feltToString(felt: any) {
    const hexStr = felt.toString(16);
    const bytes = Buffer.from(hexStr, "hex");
    return bytes.toString("utf-8").replace(/\0/g, ""); // Remove padding null characters
  }

  useEffect(() => {
    (async () => {

      setPageLoader(true)

      try {
        const res = await axios.get(
          `${base}?address=${connectedAddress.address}`
        );

        const dx = await Promise.all(
          res.data.data.map(async (e: any) => {
            const cnt = new Contract(
              abi.abi,
              e.contract,
              connectedAddress.account
            );

            const uri = (await cnt.call("tokenURI", [e.cid])) as any;

            const symbol = (await cnt.call("symbol")) as any;

            const name = (await cnt.call("name")) as any;


            function feltToNumber(felt: any) {
              return new BigNumber(felt.toString()).toNumber();
            }
          

            return {
              ...e,
              uri: displayTxResult(uri, false, [
                { type: "core::byte_array::ByteArray" },
              ]),
              symbol: feltToString(symbol.pending_word),
              name: feltToString(name.pending_word),
            };
          })
        );

        console.log(dx, 'dd')

        setNfts(dx);

        if (connectedAddress.address) setPageLoader(false);

      } catch (error) {
        console.log(error);
      }
    })();
  }, [connectedAddress.address]);

  return (
    <div className="p-6">
      <GenericModal
        className={`w-[60vw] mx-auto md:max-h-[30rem] md:max-w-[45rem]`}
        isOpen={success}
        animate={true}
        onClose={() => {
          setSuccess(false);
          setNftDesc("");
          setImage("");
          setAddress("");
          setContract("");
          setNftName("");
          window.location.reload();
        }}
      >
        <div className="p-7 w-full">
          <div className="">
            <div className="flex mb-3 justify-between items-center">
              <h1 className="text-2xl block text-center my-4 lg:text-start font-bold text-base-100 text-[1.125em]">
                NFT created successfully 🎉
              </h1>
              <button
                className="btn btn-primary btn-sm font-light hover:border-transparent bg-base-300 hover:bg-base-300 no-animation"
                onClick={() => {
                  setSuccess(false);
                  setNftDesc("");
                  setImage("");
                  setAddress("");
                  setContract("");
                  setNftName("");
                  window.location.reload();
                }}
              >
                Close
              </button>
            </div>

            {/* nft image */}

            <div className="w-[150px] h-[150px] bg-gray-200 rounded-full mb-5 mx-auto">
              <Image
                src={`${image}`}
                width={150}
                height={150}
                alt="nft"
                className="w-full h-full object-cover rounded-full"
              />
            </div>

            <div className="mt-5">
              <label className="block text-base-100 text-sm mb-2">
                Mint to anyone
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                }}
                placeholder="Enter address eg 0x..."
                className="text-base-100 py-[.7rem] px-[.4rem] hover:bg-outline-grey rounded-[10px] transition-all w-full bg-primary-content border-2 border-primary-content pl-3"
              />
            </div>

            <div className="mt-5 flex items-center">
              <button
                className="btn mx-auto btn-primary"
                onClick={async () => {
                  await mintNft(contract, tokenIds, address);

                  setTokenIds((prev) => prev + 1);
                }}
              >
                Send NFT
              </button>
            </div>
          </div>
        </div>
      </GenericModal>

      <GenericModal
        className={`w-[60vw] mx-auto md:max-h-[30rem] md:max-w-[45rem]`}
        isOpen={isModalOpen}
        animate={true}
        onClose={() => setIsModalOpen(false)}
      >
        <div className="p-7 w-full">
          <div className="">
            <h1 className="text-2xl block text-center my-4 lg:text-start font-bold text-base-100 text-[1.125em]">
              Create new NFT
            </h1>
            <div className="flex items-center gap-3">
              <div className="mt-5 w-full">
                <label className="block text-base-100 text-sm mb-2">
                  NFT Name
                </label>
                <input
                  type="text"
                  value={nftName}
                  onChange={(e) => {
                    setNftName(e.target.value);
                  }}
                  placeholder="Enter NFT name"
                  className="text-base-100 py-[.7rem] px-[.4rem] hover:bg-outline-grey rounded-[10px] transition-all w-full bg-primary-content border-2 border-primary-content pl-3"
                />
              </div>

              <div className="mt-5 w-full">
                <label className="block text-base-100 text-sm mb-2">
                  Symbol
                </label>
                <input
                  type="text"
                  value={nftSymbol}
                  onChange={(e) => {
                    setNftSymbol(e.target.value);
                  }}
                  placeholder="Enter NFT Symbol"
                  className="text-base-100 py-[.7rem] px-[.4rem] hover:bg-outline-grey rounded-[10px] transition-all w-full bg-primary-content border-2 border-primary-content pl-3"
                />
              </div>
            </div>
            <div className="mt-5">
              <label className="block text-base-100 text-sm mb-2">
                NFT Description
              </label>
              <textarea
                value={nftDesc}
                onChange={(e) => {
                  setNftDesc(e.target.value);
                }}
                placeholder="Enter NFT description"
                className="text-base-100 py-[.7rem] px-[.4rem] hover:bg-outline-grey rounded-[10px] transition-all w-full bg-primary-content border-2 border-primary-content pl-3"
              ></textarea>
            </div>
            <div className="mt-5 flex items-center">
              <button
                className="btn mx-auto btn-primary"
                onClick={() => deployContract()}
              >
                {!isLoading ? "Create NFT" : "Just a sec..."}
              </button>
            </div>
          </div>
        </div>
      </GenericModal>

      {connectedAddress.status == "disconnected" ? (
        <>
          <div className="px-5">
            <h1 className="text-center">
              <span className="block text-2xl mb-2">
                Please click the connect wallet button above to get started
              </span>
            </h1>
            <p className="text-center text-lg">
              <span className="block">
                This will allow you to interact with the Starknet network
              </span>
            </p>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-2xl block text-white">Your NFTs</h1>
              {/* loader */}
              {pageLoader && (
                <div className="ml-3">
                  <div className="loading loading-spinner loading-xs"></div>
                </div>
              )}
            </div>

            <button
              className={`btn btn-secondary btn-sm font-light hover:border-transparent bg-base-300 hover:bg-base-300 no-animation`}
              onClick={() => setIsModalOpen(true)}
            >
              Create new NFT
            </button>
          </div>
          {!nfts.length ?  <div className="px-5">
            <h1 className="text-center">
              <span className="block text-2xl mb-2">
                Its empty here
              </span>
            </h1>
            <p className="text-center text-lg">
              <span className="block">
                Click the create new NFT button above to get started
              </span>
            </p>
          </div> : <div
            style={{
              gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))",
            }}
            className="grid gap-5 items-center pt-10"
          >
            {/* show a list of nfts */}
            {nfts.map((e: any, i: number) => {

              console.log(e.url, 'from map')

              return (
                <div
                  onClick={() => {}}
                  key={i}
                  className="bg-base-100 cursor-pointer rounded-lg p-5 w-full"
                >
                  <div className="w-[150px] h-[150px] bg-gray-200 rounded-full mb-5">
                    <Image
                      src={e.uri}
                      width={150}
                      height={150}
                      alt="nft"
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>
                  <h3 className="text-xl font-bold">
                    {e.name} - {e.symbol}
                  </h3>
                  <p className="text-sm text-[#e0e0e0]">{e.desc}</p>

                  <div className="py-5 space-y-3 first:pt-0 last:pb-1">
                    <div className="flex gap-3 flex-col">
                      <p className="font-medium my-0 break-words">Mint</p>
                      <div className="flex flex-col gap-1.5 w-full">
                        <div className="flex items-center ml-2">
                          <span className="text-xs font-medium mr-2 leading-none">
                            to
                          </span>
                          <span className="block text-xs font-extralight leading-none">
                            Address
                          </span>
                        </div>
                        <div className="flex border-2 border-base-300 bg-base-200 rounded-full text-accent ">
                          <input
                            className="input input-ghost focus-within:border-transparent focus:outline-none focus:bg-transparent focus:text-gray-400 h-[2.2rem] min-h-[2.2rem] px-4 border w-full font-medium placeholder:text-accent/50 text-gray-400"
                            placeholder="Address to"
                            autoComplete="off"
                            value={nftDx?.[i]?.address || ""}
                            onChange={(e) => {
                              const dx = [...nftDx];

                              dx[i] = {
                                ...dx[i],
                                address: e.target.value,
                              };

                              setNftDx(dx);

                            }}
                            name="approve_to_core::starknet::contract_address::ContractAddress"
                          />
                        </div>
                      </div>

                      <div className="flex justify-between gap-2">
                        <div className="flex-grow basis-0"></div>
                        <div className="flex false" data-tip="false">
                          <button onClick={async () => {
                            await mintNft(e.contract, e.ids + 1, nftDx[i]?.address);
                          }} className="btn btn-secondary btn-sm">
                            Send 💸
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 py-5 first:pt-0 last:pb-1">
                    <p className="font-medium my-0 break-words">owner_of</p>
                    <div className="flex flex-col gap-1.5 w-full">
                      <div className="flex items-center ml-2">
                        <span className="text-xs font-medium mr-2 leading-none">
                          token_id
                        </span>
                        <span className="block text-xs font-extralight leading-none">
                          u256
                        </span>
                      </div>
                      <div className="flex border-2 border-base-300 bg-base-200 rounded-full text-accent ">
                        <input
                          value={nftDx?.[i]?.token_id || ""}
                          className="input input-ghost focus-within:border-transparent focus:outline-none focus:bg-transparent focus:text-gray-400 h-[2.2rem] min-h-[2.2rem] px-4 border w-full font-medium placeholder:text-accent/50 text-gray-400"
                          placeholder="u256 token_id"
                          autoComplete="off"
                          onChange={(e) => {
                            const dx = [...nftDx];

                            dx[i] = {
                              ...dx[i],
                              token_id: e.target.value,
                            };

                            setNftDx(dx);
                          }}
                          name="owner_of_token_id_core::integer::u256"
                        />
                      </div>
                    </div>
                    <div className="flex justify-between gap-2 flex-wrap">
                      <div className="flex-grow break-words w-4/5">
                        {nftDx?.[i]?.token_result}
                      </div>
                      <button
                        onClick={async () => {
                          const ee = toast.loading("Just a sec...");

                          const contract = new Contract(
                            abi.abi,
                            e.contract,
                            connectedAddress.account
                          );

                          function feltToAddress(felt: any) {
                            let hexStr = felt.toString(16);
                          
                            if (hexStr.length % 2 !== 0) {
                              hexStr = "0" + hexStr;
                            }
                          
                            return "0x" + hexStr;
                          }

                          const res = await contract.ownerOf(
                            nftDx[i]?.token_id
                          );

                          toast.dismiss(ee);

                          const dx = [...nftDx];

                          dx[i] = {
                            ...dx[i],
                            token_result: feltToAddress(res),
                          };

                          setNftDx(dx);

                        }}
                        className="btn btn-secondary btn-sm"
                      >
                        Read 📡
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>}
        </>
      )}
    </div>
  );
};

export default Home;
