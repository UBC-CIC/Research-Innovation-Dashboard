import * as React from 'react';
import Box from '@mui/material/Box';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CircularProgress from '@mui/material/CircularProgress';

const ubcBlueColor = createTheme({
    palette: {
      primary: {
        main: '#002145'
      },
    },
});

export default function LoadingWheel(){
    return(
        <Box
            sx={{flexGrow: 1}}
            display="flex"
            alignItems="center"
            justifyContent="center"
            height={"50vh"}
            maxHeight={"100%"}
            width={"100vw"}>
                <ThemeProvider theme={ubcBlueColor}>
                    <CircularProgress size={60} /> 
                </ThemeProvider>
        </Box>
    );
}