import React, { useState, useEffect } from "react";
import { BigNumber } from "ethers";
import { MerkleTree } from "merkletreejs";
import { keccak256 } from "ethers/lib/utils";
import { Col, Row } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import { whiteList } from "../../constants/whitelist";
import { connectWallet, getCurrentWalletConnected, getContract } from "../../util/interact";
import "react-toastify/dist/ReactToastify.css";
import "./content.css";


const Content = () => {

  const [walletAddress, setWalletAddress] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setMintLoading] = useState(false);
  const [totalSupply, setTotalSupply] = useState(0);
  const [tokenPrice, setTokenPrice] = useState(null);
  const [maxTokens, setMaxTokens] = useState(0);
  const [maxTokenPurchase, setMaxTokenPurchase] = useState(0);
  const [addrWhiteList, setAddrWhiteList] = useState(null)
  const [mintCount, setMintCount] = useState(1);
  
  const offset = (new Date().getTimezoneOffset()) * 60 * 1000
  const presaleTime = new Date("February 20, 2022 00:00:00").getTime() - offset
  const pubsaleTime = new Date("February 21, 2030 00:00:00").getTime() - offset


  useEffect(async () => {
    const { address, status } = await getCurrentWalletConnected();
    setWalletAddress(address.toString().toLowerCase());
    setStatus(status);
    let whitelist = whiteList.map(addr => addr.toString().toLowerCase());
    setAddrWhiteList(whitelist)
  }, []);

  useEffect(async () => {
    if (!loading) {
      let contract = getContract();
      let res = await contract.totalSupply();
      let mtb = await contract.MAX_TOKENS();
      let mtp = await contract.maxTokenPurchase();
      let tp = await contract.tokenPrice()
      setTotalSupply(parseInt(BigNumber.from(res).toString()));
      setMaxTokens(parseInt(BigNumber.from(mtb).toString()));
      setMaxTokenPurchase(parseInt(BigNumber.from(mtp).toString()));
      setTokenPrice( (BigNumber.from(tp).div(BigNumber.from(1e9).mul(BigNumber.from(1e4))).toString() ) )  // original value * 1e5
    }
  }, [loading, walletAddress]);

  useEffect(() => {
    if (status) {
      notify();
      setStatus(null);
    }
  }, [status]);

  const notify = () => toast.info(status, {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  });

  const onClickConnectWallet = async () => {
    const walletResponse = await connectWallet();
    setStatus(walletResponse.status);
    setWalletAddress(walletResponse.address);
  };

  const onClickDisconnectWallet = async () => {
    setWalletAddress(null);
  };

  //////// *** Mint Function *** ////////
  function increase() {
    if (mintCount < maxTokenPurchase) {
      console.log(mintCount, maxTokenPurchase)
      let newCount = mintCount + 1;
      setMintCount(newCount);
    }
  }

  function decrease() {
    if (mintCount > 1) {
      let newCount = mintCount - 1;
      setMintCount(newCount);
    }
  }

  function onChangeCountInput(e) {
    if (!e.target.validity.patternMismatch) {
      if(e.target.value == "") {
        e.preventDefault()
        return
      }
      let inputVal = parseInt(e.target.value)
      if (inputVal > maxTokenPurchase || inputVal < 1) {
        e.preventDefault()
        return
      }
      setMintCount(inputVal)
    }
  }

  async function onMint() {
    let curTime = new Date().getTime()
    if (!walletAddress) {
        setStatus('Please connect your Wallet')
        return
    }
    const contract = getContract(walletAddress)
    if(curTime < presaleTime) {
        setStatus('Please wait for the private sale time')
        return
    }
    // Check user is whitelisted for pre-sale
    if(curTime>=presaleTime && curTime<pubsaleTime && Array.isArray(addrWhiteList) && walletAddress != null) {
        if(!addrWhiteList.includes(walletAddress.toString().toLowerCase())) {
            setStatus('Please wait for the public sale time')
            return
        } else {
          // Pre-sale Mint
          setMintLoading(true)
          const leafNodes = addrWhiteList.map(addr => keccak256(addr));
          const merkleTree = new MerkleTree(leafNodes, keccak256, {sortPairs: true});
          let claimingAddress = keccak256(walletAddress);
          let hexProof = merkleTree.getHexProof(claimingAddress);
          try {
            let tx = await contract.preMint(hexProof, mintCount, { value: BigNumber.from(1e9).mul(BigNumber.from(1e4)).mul(tokenPrice).mul(mintCount), from: walletAddress })
            let res = await tx.wait()
            if (res.transactionHash) {
                setStatus(`You minted ${mintCount} CATA Successfully`)
                setMintLoading(false)
            }
          } catch (err) {
            console.log(err)
              let errorContainer =  (err.error && err.error.message)  ? err.error.message : ''
              let errorBody = errorContainer.substr(errorContainer.indexOf(":")+1)
              let status = "Transaction failed because you have insufficient funds or sales not started"
              errorContainer.indexOf("execution reverted") === -1 ? setStatus(status) : setStatus(errorBody)
              setMintLoading(false)
          }
        }
    }
    if(curTime >= pubsaleTime) {
      // Pub-sale Mint
      setMintLoading(true)
      setStatus('Minting, please wait for a moment...')
      try {
        let tx = await contract.pubMint(mintCount, { value: BigNumber.from(1e9).mul(BigNumber.from(1e4)).mul(tokenPrice).mul(mintCount), from: walletAddress })
        let res = await tx.wait()
        if (res.transactionHash) {
            setStatus(`You minted ${mintCount} CATA Successfully`)
            setMintLoading(false)
        }
      } catch (err) {
          let errorContainer =  (err.error && err.error.message)  ? err.error.message : ''
          let errorBody = errorContainer.substr(errorContainer.indexOf(":")+1)
          let status = "Transaction failed because you have insufficient funds or sales not started"
          errorContainer.indexOf("execution reverted") === -1 ? setStatus(status) : setStatus(errorBody)
          setMintLoading(false)
      }
    }
  }

  return (
    <div className="content-wrapper">
      <div className="wallet-container">
        {walletAddress ? (
          <a className="wallet-btn-body button">
            <div className="wallet-btn-text" onClick={onClickDisconnectWallet}> {walletAddress.slice(0, 15)}... </div>
          </a>
        ) : (
          <a className="wallet-btn-body button">
            <div className="wallet-btn-text" onClick={onClickConnectWallet}> NOT CONNECTED </div>
        </a>
        )}

      </div>
      <div className="mint-container">
        <Row>
          <Col md="12" lg="7">
              <div className="mint-info">
                <div className="mint-info-contain">
                  <h1> Minting Soon </h1>
                  <p className="mint-price"> Price {tokenPrice/100000} ETH / MINT </p>
                  <p> Total supply: {totalSupply.toLocaleString()} </p> 
                  <br/>
                  <p> Note: Supply & Price are fetched every 5 seconds </p>          
                </div>
              </div>
          </Col>
          <Col md="12" lg="5">
            <div className="mint-box">
              <img src={"/assets/reveal.gif"} width={'400px'} />
              <div className="mint-actions">
                <div className="text-large prominent">
                  <p> <span className="mint-left">  {maxTokens - totalSupply} </span> <span style={{fontSize:'40px', position:'relative', bottom:'5px'}}>LEFT</span> </p>
                </div>
                <div id="mint_count">
                  <button className="minus-btn" onClick={() => decrease()}> - </button>
                  <input value={mintCount || ''} pattern="^[0-9]*$" onChange={onChangeCountInput} />
                  <button className="plus-btn" onClick={() => increase()}> + </button>
                </div>

                {loading ? (
                  <a className="mint-btn-body button">
                    <div className="mint-btn-text" onClick={onMint}> Minting... </div>
                  </a>
                ) : (
                  <a className="mint-btn-body button">
                    <div className="mint-btn-text" onClick={onMint}> MINT NOW </div>
                  </a>
                )}

              </div>
            </div>
          </Col>
        </Row>
      </div>
      {/* <div className="lastdiv"></div> */}
      <ToastContainer />
    </div>
  );
};

export default Content;
