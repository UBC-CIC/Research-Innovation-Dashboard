import "./App.css";
import { StyledEngineProvider } from "@mui/material/styles";
import { ThemeProvider } from "@mui/material/styles";
import Amplify from "aws-amplify";
import awsmobile from "./aws-exports";
import { Hub } from "aws-amplify";
import { BrowserRouter } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { connect } from "react-redux";
import { updateLoginState } from "./actions/loginActions";
import theme from "./themes";
import Login from "./components/authentication/Login_material";
import PageContainer from "./views/pageContainer/PageContainer";
import { Auth } from "aws-amplify";

Amplify.configure(awsmobile);

function App(props) {
  const { loginState, updateLoginState } = props;

  const [currentLoginState, updateCurrentLoginState] = useState(loginState);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setAuthListener();
  }, []);

  useEffect(() => {
    console.log(loginState)
    updateCurrentLoginState(loginState);
  }, [loginState]);

  useEffect(() => {
    async function retrieveUser() {
      try {
        Auth.currentAuthenticatedUser()
          .then((user) => {
            updateLoginState("signedIn");
          })
          .catch((err) => {
            updateLoginState("signIn");
          });
      } catch (e) {}
    }
    retrieveUser().then(() => {const timeoutId = setTimeout(() => setLoading(false), 0);});
  }, []);

  async function setAuthListener() {
    Hub.listen("auth", (data) => {
      switch (data.payload.event) {
        case "signOut":
          updateLoginState("signIn");
          break;
        default:
          break;
      }
    });
  }

  //Here to prevent the login page from flashing before the user is authenticated
  if (loading) {
    return (
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={theme}>
          <div style={{ width: "100vw", height: "100vh", overflowX: "hidden" }}>
          </div>
        </ThemeProvider>
      </StyledEngineProvider>
    );
  }

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <div style={{ width: "100vw", height: "100vh", overflowX: "hidden" }}>
          {currentLoginState !== "signedIn" && (
            <Login
              logo={"custom"}
              type={"image"}
              themeColor={"standard"}
              animateTitle={false}
              title={"Research Expertise Portal"}
              darkMode={true}
              disableSignUp={true}
            />
          )}
          {currentLoginState === "signedIn" && (
            <BrowserRouter>
              <PageContainer />
            </BrowserRouter>
          )}
        </div>
      </ThemeProvider>
    </StyledEngineProvider>
  );
}

const mapStateToProps = (state) => {
  return {
    loginState: state.loginState.currentState,
  };
};

const mapDispatchToProps = {
  updateLoginState,
};

export default connect(mapStateToProps, mapDispatchToProps)(App);
