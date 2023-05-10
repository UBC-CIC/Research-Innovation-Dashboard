import React from 'react';
import Grid from '@mui/material/Grid';
import HomePageIcon from './HomePageIcon';
import PersonIcon from '@mui/icons-material/Person';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import VerifiedIcon from '@mui/icons-material/Verified';

import PeopleIcon from '@mui/icons-material/People';


function HomePageBar({researchersCount, publicationsCount, grantsCount, patentsCount}) {
  return (
    <Grid
      container
      justifyContent="center"
      align="center"
      sx={{
        borderTop: '1px solid #000000',
        borderBottom: '1px solid #000000',
        paddingTop: 2,
        paddingBottom: 2,
      }}
    >
      <Grid item xs={12} sm={6} md={1.5} sx={{ display: 'flex', justifyContent: 'center' }}>
        <HomePageIcon linkTo="/Search/Researchers/%20/%20/%20/" IconComponent={PeopleIcon} text="Researchers" count={researchersCount} iconFontSize={60} />
      </Grid>
      <Grid item xs={12} sm={6} md={1.5} sx={{ display: 'flex', justifyContent: 'center' }}>
        <HomePageIcon linkTo="/Search/Publications/%20/%20/" IconComponent={MenuBookIcon} text="Publications" count={publicationsCount} iconFontSize={60} />
      </Grid>
      <Grid item xs={12} sm={6} md={1.5} sx={{ display: 'flex', justifyContent: 'center' }}>
        <HomePageIcon linkTo="/Search/Grants/%20/%20/" IconComponent={AccountBalanceIcon} text="Grants" count={grantsCount} iconFontSize={60} />
      </Grid>
      <Grid item xs={12} sm={6} md={1.5} sx={{ display: 'flex', justifyContent: 'center' }}>
        <HomePageIcon linkTo="/Search/Patents/%20/%20/" IconComponent={VerifiedIcon} text="Patents" count={patentsCount} iconFontSize={60} />
      </Grid>
    </Grid>
  );
}

export default HomePageBar;