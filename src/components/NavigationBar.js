import React, { useState, useEffect } from "react";
import { ExitToApp, Menu } from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import {
  AppBar,
  Box,
  Toolbar,
  Button,
  ButtonGroup,
  Typography,
} from "@mui/material";
import { Auth } from "aws-amplify";
import { connect } from "react-redux";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { updateLoginState } from "../actions/loginActions";

const headerTheme = createTheme({
  palette: {
    primary: {
      main: "#002145",
    },
    secondary: {
      main: "#FFFFFF",
    },
  },
});

headerTheme.typography.h3 = {
  fontSize: "1.0rem",

  [headerTheme.breakpoints.up("sm")]: {
    fontSize: "1.7rem",
  },

  [headerTheme.breakpoints.up("md")]: {
    fontSize: "2.4rem",
  },
};
const NavButton = styled(Button)`
  color: #ffffff;
  font-family: Arial;
  :hover {
    opacity: 0.7;
  }
`;

function Navbar(props) {
  const { updateLoginState, loginState, adminUser } = props;
  const navigate = useNavigate();

  const [navMenuOpen, setNavMenuOpen] = useState(false);
  const [user, setUser] = useState("");
  const [loadingBackdrop, setLoadingBackdrop] = useState(false);

  const menuView = useMediaQuery((theme) => theme.breakpoints.down("md"));
  const [activeButton, setActiveButton] = useState("");

  const handleLogout = async () => {
    setLoadingBackdrop(true);
    await new Promise((r) => setTimeout(r, 1000));
    await onSignOut();
    setLoadingBackdrop(false);
  };

  useEffect(() => {
    async function retrieveUser() {
      try {
        const returnedUser = await Auth.currentAuthenticatedUser();
        setUser(returnedUser.attributes.email);
      } catch (e) {}
    }
    retrieveUser();
  }, [loginState]);

  async function onSignOut() {
    updateLoginState("signIn");
    navigate("/");
    await Auth.signOut();
  }

  const location = useLocation();

  useEffect(() => {
    const currentPath = location.pathname;
    if(currentPath.includes("/Search/Researchers/")){
      setActiveButton("Researchers")
    }
    else if(currentPath.includes("/Search/Publications/")){
      setActiveButton("Publications")
    }
    else if(currentPath.includes("/Search/Grants/")){
      setActiveButton("Grants")
    }
    else if(currentPath.includes("/Search/Patents/")){
      setActiveButton("Patents")
    }
    else if(currentPath.includes("/Impact/")){
      setActiveButton("Impact")
    }
    else if(currentPath.includes("/Metrics/")){
      setActiveButton("Metrics")
    }
    else if(currentPath.includes("AdminDashboard")){
      setActiveButton("AdminDashboard")
    }
    else if(currentPath.includes("Researchers")) {
      setActiveButton("ResearchersTab") // No tab highlighted for researchers page
    }
    else {
      setActiveButton("Home")
    }

    // setActiveButton(currentPath);
  }, [location]);

  const activeButtonStyle = {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  };

  return (
    <ThemeProvider theme={headerTheme}>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar
          position="static"
          sx={{ backgroundColor: "white" }}
          elevation={0}
          variant="outlined"
        >
          <Toolbar style={{ paddingLeft: "2%" }} sx={{ height: 10 }}>
            <Typography
              style={{ textDecoration: "none" }}
              component={Link}
              to="/"
              // onClick={() => navigate("/")}
              onClick={() => window.location.href = "/ / / / / / /"}
              variant="h3"
              color="#002145"
            >
              Expertise Dashboard
            </Typography>
          </Toolbar>
        </AppBar>
      </Box>
      {/* all navbar buttons */}
      <Box
        sx={{
          display: "flex",
          justifyContent: menuView ? "flex-end" : "space-between",
          backgroundColor: "#002145",
          flexGrow: 1,
          "& > *": { ml: "0%" },
          py: "0.5em",
          height: navMenuOpen ? "auto" : "50px",
          pr: "4%",
          flexWrap: menuView && "wrap",
          boxSizing: menuView && "border-box",
        }}
      >
        <Menu
          sx={{
            display: { xs: "block", md: "none" },
            cursor: "pointer",
            alignSelf: "center",
          }}
          onClick={() => setNavMenuOpen(!navMenuOpen)}
          color="secondary"
        />
        <Box
          sx={{
            width: "100%",
            justifyContent: "space-between",
            display: { xs: navMenuOpen ? "flex" : "none", md: "flex" },
            flexDirection: { xs: "column", md: "row" },
          }}
        >
          {/* app page buttons */}
          <ButtonGroup
            color="secondary"
            orientation={menuView ? "vertical" : "horizontal"}
            size="large"
            variant="text"
            aria-label="navbar button group"
          >
            <NavButton
              sx={{
                paddingLeft: "28px",
                paddingRight: "28px",
                ...(activeButton === "Home" && activeButtonStyle),
              }}
              onClick={() => (window.location.href = "/ / / / / / /")}
            >
              Home
            </NavButton>
            <NavButton
              sx={{
                paddingLeft: "28px",
                paddingRight: "28px",
                ...(activeButton === "Researchers" && activeButtonStyle),
              }}
              onClick={() =>
                (window.location.href = "/Search/Researchers/ / / /")
              }
            >
              Researchers
            </NavButton>
            <NavButton
              sx={{
                paddingLeft: "28px",
                paddingRight: "28px",
                ...(activeButton === "Publications" && activeButtonStyle),
              }}
              onClick={() =>
                (window.location.href = "/Search/Publications/ / /")
              }
            >
              Publications
            </NavButton>
            <NavButton
              sx={{
                paddingLeft: "28px",
                paddingRight: "28px",
                ...(activeButton === "Grants" && activeButtonStyle),
              }}
              onClick={() =>
                (window.location.href = "/Search/Grants/ / /")
              }
            >
              Grants
            </NavButton>
            <NavButton
              sx={{
                paddingLeft: "28px",
                paddingRight: "28px",
                ...(activeButton === "Patents" && activeButtonStyle),
              }}
              onClick={() =>
                (window.location.href = "/Search/Patents/ / /")
              }
            >
              Patents
            </NavButton>
            <NavButton 
              sx={{
                paddingLeft: "28px",
                paddingRight: "28px",
                ...(activeButton === "Impact" && activeButtonStyle),
              }}
              onClick={() => navigate("/Impact/")}>
                Impact
            </NavButton>
            <NavButton 
              sx={{
                paddingLeft: "28px",
                paddingRight: "28px",
                ...(activeButton === "Metrics" && activeButtonStyle),
              }}
              onClick={() => navigate("/Metrics/")}>
                Metrics
            </NavButton>
            {adminUser && (
              <NavButton 
              sx={{
                paddingLeft: "28px",
                paddingRight: "28px",
                ...(activeButton === "AdminDashboard" && activeButtonStyle),
              }}
                onClick={() => navigate("/AdminDashboard/")}>
                Admin Dashboard
              </NavButton>
            )}
          </ButtonGroup>{" "}
          {/* logout button */}
          <NavButton
            onClick={handleLogout}
            sx={{ mt: menuView && navMenuOpen && "1em" }}
          >
            <span>Logout</span>
            <ExitToApp color={"secondary"} />
          </NavButton>
        </Box>
      </Box>
    </ThemeProvider>
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

export default connect(mapStateToProps, mapDispatchToProps)(Navbar);
