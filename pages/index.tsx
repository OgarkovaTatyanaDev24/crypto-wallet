import { MetaMaskUIProvider } from "@metamask/sdk-react-ui";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import { blueGrey } from '@mui/material/colors';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

export default function Metamask() {
  const [userAccount, setUserAccount] = useState('');
  const [balance, setBalance] = useState("0");
  const [address, setAddress] = useState("");
  const [chain, setChain] = useState(1);

  const [sendAmount, setSendAmount] = useState("0");
  const [sendAddress, setSendAddress] = useState("");
  const [alignment, setAlignment] = useState<string | null>('left');

  const chainMap = new Map([['ETH', 1], ['BNB', 56], ['ETH test', 11155111], ['BNB test', 97]])

  const toHex = (num: Number): string => "0x" + num.toString(16)

  const chainDataMap = new Map([
    [1, {
      chainName: 'Etherium Mainnet',
      chainId: toHex(1),
      nativeCurrency: { name: 'Etherium', decimals: 18, symbol: 'MATIC' },
      rpcUrls: ['https://polygon-rpc.com/']
    }],
    [56, {
      chainName: 'BNB Chain',
      chainId: toHex(56),
      nativeCurrency: { name: 'BNB', decimals: 18, symbol: 'BNB' },
      rpcUrls: ['https://polygon-rpc.com/']
    }],
    [11155111, {
      chainName: 'Sepolia',
      chainId: toHex(11155111),
      nativeCurrency: { name: 'Sepolia', decimals: 18, symbol: 'ETH' },
      rpcUrls: ['https://polygon-rpc.com/']
    }],
    [97, {
      chainName: 'BNB Testnet',
      chainId: toHex(97),
      nativeCurrency: { name: 'BNB Testnet', decimals: 18, symbol: 'BNB' },
      rpcUrls: ['https://polygon-rpc.com/']
    }]
  ])

  const Connect = async () => {
    if (window.ethereum) {
      window.ethereum
        .request({ method: 'eth_requestAccounts' })
        .then((account) => {
          if (account?.constructor === Array) setUserAccount(account[0]);
        });
      window.ethereum.on('accountChanged', Connect);
    } else {
      alert('установите метамаск')
    }
  };
  useEffect(
    () => {
      if (!userAccount) {
        Connect()
      }
      setAddress(userAccount)
      window.ethereum
        ?.request({
          method: 'eth_getBalance',
          params: [userAccount, 'latest'],
        })
        .then((b) => {
          if (b?.constructor === String) setBalance(ethers.formatEther(b));
        })
    }, [userAccount, chain])

  const ChangeChain = (chainId: number | undefined) => {
    if (chainId === undefined) return
    window.ethereum?.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: toHex(chainId) }]
    }).catch(err => {
      if (err.code === 4902) {
        window.ethereum?.request({
          method: 'wallet_addEthereumChain',
          params: [
            chainDataMap.get(chainId)
          ]
        });
      }
    }).then(
      () => { setChain(chainId) }
    )
  }

  const handleAlignment = (
    event: React.MouseEvent<HTMLElement>,
    newAlignment: string | null,
  ) => {
    if (newAlignment !== null) {
      setAlignment(newAlignment);
    }
  };

  const sendTransaction = async () => {
    if (window.ethereum === undefined) return
    const provider = new ethers.BrowserProvider(window.ethereum, chain);
    const signer = await provider.getSigner();
    const fee = await provider.getFeeData();
    const tx = {
      to: sendAddress,
      value: ethers.parseUnits(sendAmount, 18),
      gasLimit: toHex(Number(100000)),
      gasPrice: fee.gasPrice,
    };
    signer
      .sendTransaction(tx)
      .then((transferResult: any) => {
        console.log("transferResult", transferResult);
      })
      .catch((error: any) => {
        console.error("Error", error);
      });
  }

  return (
    <Paper
      elevation={4}
      sx={{ maxWidth: 600, margin: "auto", mt: 20, backgroundColor: blueGrey[50], p: 5 }
      }>
      <ToggleButtonGroup
        color="primary"
        value={alignment}
        exclusive
        onChange={handleAlignment}
        aria-label="text alignment"
      >
        <ToggleButton value="left" aria-label="left aligned" onClick={(e) => ChangeChain(chainMap.get("ETH"))}>
          ETH
        </ToggleButton>
        <ToggleButton value="center" aria-label="centered" onClick={(e) => ChangeChain(chainMap.get("BNB"))}>
          BNB
        </ToggleButton>
        <ToggleButton value="right" aria-label="right aligned" onClick={(e) => ChangeChain(chainMap.get("ETH test"))}>
          ETH test
        </ToggleButton>
        <ToggleButton value="justify" aria-label="justified" onClick={(e) => ChangeChain(chainMap.get("BNB test"))}>
          BNB test
        </ToggleButton>
      </ToggleButtonGroup>
      <List disablePadding>
        <ListItem sx={{
          pt: 5, pr: 5, borderBottom: 1, borderBlockColor: blueGrey[200]
        }}>
          <ListItemText
            primary="Balance:"
          />
          <Typography variant="body1" fontWeight="medium">
            {balance}
          </Typography>
        </ListItem>
        <ListItem sx={{ pr: 5, mb: 5, borderBottom: 1, borderBlockColor: blueGrey[200] }}>
          <ListItemText sx={{ minWidth: 90 }}
            primary="Address:"
          />
          <div style={{ overflow: "hidden", width: '100%', display: "block" }}>
            <Typography noWrap={false} textAlign={"right"} variant="body1" fontWeight="medium">
              {address}
            </Typography>
          </div>
        </ListItem>
      </List>
      <Stack direction="row" spacing={2} justifyContent={"space-between"}>
        <TextField
          value={sendAddress} onChange={(e) => setSendAddress(e.target.value)}
          fullWidth label="Send to address" variant="outlined" size="small" />
        <TextField
          value={sendAmount} onChange={(e) => setSendAmount(e.target.value)}
          inputProps={{ type: 'number' }} label="Amount" variant="outlined" size="small" />
        <Button variant="contained" onClick={(e) => sendTransaction()}>Send</Button>
      </Stack>
    </Paper >
  );
}
