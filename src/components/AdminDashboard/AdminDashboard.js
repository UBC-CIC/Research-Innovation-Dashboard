import React, { useState, useEffect } from "react";
import { Paper, Typography, Tab, Box } from "@mui/material";
import TabPanel from "@mui/lab/TabPanel";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import AdminDashboardInputRow from "./AdminDashboardInputRow";
import ChangeScopusIdPopup from "./ChangeScopusIdPopup";
import UpdatePubsLogTable from "./UpdatePubsLogTable";
import UpdateResearcherLogTable from "./UpdateResearcherLogTable";
import FlaggedIds from "./FlaggedIds";

export default function AdminDashboard() {
  const [oldScopusId, setOldScopusId] = useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const tabs = ["Logs", "Change Scopus ID", "Flagged IDs"];
  const [selectedTab, setSelectedTab] = useState(tabs[0]);

  const handleTabChange = (e, newValue) => {
    setSelectedTab(newValue);
  };
  // for this you are going to want them to input the new scopus ID then we gather information on the person
  // display new information and ask if this is the person they want to change it to.
  // then trigger a lambda that will run and update the person information.

  return (
    <Box>
      <Paper
        square={true}
        elevation={0}
        sx={{
          borderBottom: 1,
          borderColor: "rgba(0, 0, 0, 0.12)",
        }}
        direction="row"
      >
        <Typography variant="h4" sx={{ m: "2%" }}>
          Admin Dashboard
        </Typography>
      </Paper>
      <TabContext value={selectedTab}>
        <Box
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            maxWidth: { xs: 320, sm: "100%" },
          }}
        >
          <TabList
            onChange={handleTabChange}
            aria-label="admin dashboard tabs"
            variant="scrollable"
            scrollButtons
            allowScrollButtonsMobile
          >
            <Tab label={tabs[0]} value={tabs[0]} />
            <Tab label={tabs[1]} value={tabs[1]} />
            <Tab label={tabs[2]} value={tabs[2]} />
          </TabList>
        </Box>
        <TabPanel value={tabs[0]}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: "2em" }}>
            <UpdatePubsLogTable />
            <UpdateResearcherLogTable />
          </Box>
        </TabPanel>
        <TabPanel value={tabs[1]}>
          <AdminDashboardInputRow
            inputDescription={"Researcher Scopus ID you would like to change"}
            inputValue={oldScopusId}
            setValue={setOldScopusId}
            setOpen={setDialogOpen}
            buttonText={"Look Up Scopus ID"}
          />
          <ChangeScopusIdPopup
            open={dialogOpen}
            setOpen={setDialogOpen}
            oldScopusId={oldScopusId}
          />
        </TabPanel>
        <TabPanel value={tabs[2]}>
          <FlaggedIds />
        </TabPanel>
      </TabContext>
      {/* <Grid item xs={12}>
        <UpdatePubsLogTable />
      </Grid>
      <Grid item xs={12}>
        <UpdateResearcherLogTable />
      </Grid>
      <AdminDashboardInputRow
        inputDescription={"Researcher Scopus ID you would like to change"}
        inputValue={oldScopusId}
        setValue={setOldScopusId}
        setOpen={setDialogOpen}
        buttonText={"Look Up Scopus ID"}
      />
      <ChangeScopusIdPopup
        open={dialogOpen}
        setOpen={setDialogOpen}
        oldScopusId={oldScopusId}
      /> */}
    </Box>
  );
}
