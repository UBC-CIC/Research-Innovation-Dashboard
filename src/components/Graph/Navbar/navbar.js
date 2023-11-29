import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import Container from '@mui/material/Container';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import SettingsIcon from '@mui/icons-material/Settings';
import "./navbar.css";
import { Auth } from 'aws-amplify';

const settings = ['Logout'];


export default function Nav_Bar(props) {
  const [anchorElUser, setAnchorElUser] = React.useState(null);

  async function signOut() {
    try {
        await Auth.signOut();
    } catch (error) {
        console.log('error signing out: ', error);
    }
  }

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  return (
    <AppBar id="navbar-appbar" position="static">
        <Container maxWidth="x1">
            <Toolbar disableGutters>
                <Typography
                className="navbar-text"
                variant="h6"
                noWrap
                component="a"
                href="/"
                xs="none"
                md="flex"
                >
                Innovation Connections
                </Typography>
                <Box sx={{ flexGrow: 0 }}>
                    <Tooltip title="Open settings">
                    <IconButton 
                        sx={{ color: 'white'}} 
                        onClick={handleOpenUserMenu}>
                        <SettingsIcon />
                    </IconButton>
                    </Tooltip>
                    <Menu
                        sx={{ mt: '45px' }}
                        id="menu-appbar"
                        anchorEl={anchorElUser}
                        anchorOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                        }}
                        keepMounted
                        transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                        }}
                        open={Boolean(anchorElUser)}
                        onClose={handleCloseUserMenu}
                    >
                      <MenuItem key={'Tutorial'} onClick={handleCloseUserMenu}>
                        <Typography onClick={() => {props.startTutorial()}} textAlign="center">{'Start Tour'}</Typography>
                      </MenuItem>
                      <MenuItem key={'Logout'} onClick={handleCloseUserMenu}>
                        <Typography onClick={() => {signOut();}} textAlign="center">{'Logout'}</Typography>
                      </MenuItem>
                        {/* {settings.map((setting) => (
                        <MenuItem key={setting} onClick={handleCloseUserMenu}>
                            <Typography textAlign="center">{setting}</Typography>
                        </MenuItem>
                        ))} */}
                    </Menu>
                </Box>
            </Toolbar>
        </Container>
    </AppBar>
  );
}