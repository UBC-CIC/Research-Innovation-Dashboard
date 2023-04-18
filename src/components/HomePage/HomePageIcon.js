import * as React from 'react';
import { Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import { Typography } from '@mui/material';

export default function HomePageIcon({ linkTo, IconComponent, text, count, iconFontSize }) {
  function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  return (
    <Link to={linkTo} style={{ textDecoration: 'none' }}>
      <Grid container>
        <Grid item xs={12}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              '&:hover .iconColor': {
                color: '#00A6D6',
                cursor: 'pointer',
              },
            }}
          >
            <IconComponent className="iconColor" color="action" sx={{ fontSize: iconFontSize }} />
            {count && (
              <Typography
                sx={{
                  marginLeft: 1,
                  fontSize: '1.0rem',
                  fontWeight: 'bold',
                  backgroundColor: '#555',
                  color: '#fff',
                  padding: '0.1rem 0.3rem',
                  borderRadius: '0.2rem',
                  '&:hover': { cursor: 'pointer' },
                }}
              >
                {numberWithCommas(count)}
              </Typography>
            )}
          </Box>
        </Grid>
        <Grid item xs={12}>
          <Typography sx={{ color: '#00A6D6', '&:hover': { cursor: 'pointer' }, fontSize: '1.3rem' }}>
            {text}
          </Typography>
        </Grid>
      </Grid>
    </Link>
  );
}