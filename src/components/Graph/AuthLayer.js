import React, { useEffect, useState } from 'react'
import { Box } from '@mui/system';
import { Amplify } from "aws-amplify";
import awsmobile from "../aws-exports";
import { Hub } from "aws-amplify";
import { Auth } from 'aws-amplify';
import TheApp from "./TheApp"
import Login from "./Authentication/Login"

Amplify.configure(awsmobile);

function AuthLayer(props) {

  const [loggedIn, setLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    setAuthListener();
    document.title = "Knowledge Graph";
  }, []);

  useEffect(() => {
    async function retrieveUser() {
      try {
        Auth.currentAuthenticatedUser()
          .then((user) => {
            setUserEmail(user.attributes.email);
            setLoggedIn(true)
          })
          .catch((err) => {
            setLoggedIn(false)
          });
      } catch (e) {}
    }
    retrieveUser();
  }, []);

  async function setAuthListener() {
    Hub.listen("auth", (data) => {
      console.log(data.payload.event);
      switch (data.payload.event) {
        case 'signIn':
            console.log('user signed in');
            setLoggedIn(true)
            break;
        case 'signUp':
            console.log('user signed up');
            setLoggedIn(false)
            break;
        case 'signOut':
            console.log('user signed out');
            setLoggedIn(false)
            break;
        case 'signIn_failure':
            console.log('user sign in failed');
            setLoggedIn(false)
            break;
        case 'tokenRefresh':
            console.log('token refresh succeeded');
            setLoggedIn(true)
            break;
        case 'tokenRefresh_failure':
            console.log('token refresh failed');
            setLoggedIn(false)
            break;
        default:
          break;
      }
    });
  }

  return (
    <Box>
        {!loggedIn && <Login createNewAccountsAllowed={false} />}
        {loggedIn && <TheApp />}
    </Box>
  );
}

export default AuthLayer