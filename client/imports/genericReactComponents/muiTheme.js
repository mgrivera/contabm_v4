

import { createMuiTheme } from '@material-ui/core/styles';

let theme = createMuiTheme({

    typography: {
      // h5: {
      //   fontWeight: 500,
      //   fontSize: 26,
      //   letterSpacing: 0.5,
      // },
    },
    palette: {
      primary: {
        light: '#89b0ff',                           // '#337AB7',
        main: '#5381d6',                           // '#337AB7',
        dark: '#0755a4',                           // '#286090',
      },
    },
    shape: {
      borderRadius: 4,
    },
  });
  
  theme = {
    ...theme,
    overrides: {
      MuiDrawer: {
        paper: {
          backgroundColor: '#18202c',
        },
      },
      MuiButton: {
        label: {
          textTransform: 'none',
          fontSize: '12px',
        },
        contained: {
          boxShadow: 'none',
          '&:active': {
            boxShadow: 'none',
          },
        },
      },
  
      MuiToolbar: {
        regular: {
          // to tell mui use this style from xs up ... 
          [theme.breakpoints.up('xs')]: {
            minHeight: '44px',
          },
        },
      },
      MuiTabs: {
        root: {
          marginLeft: theme.spacing(1),
        },
        indicator: {
          height: 3,
          borderTopLeftRadius: 3,
          borderTopRightRadius: 3,
          // backgroundColor: theme.palette.common.white,     // don't want it white; the default is the same as text (primary) 
        },
      },
      MuiTab: {
        root: {
          textTransform: 'none',
          margin: '0 16px',
          minWidth: 0,
          padding: 0,
          [theme.breakpoints.up('md')]: {
            padding: 0,
            minWidth: 0,
          },
        },
      },
      MuiIconButton: {
        root: {
          padding: theme.spacing(1),
        },
      },
      MuiTooltip: {
        tooltip: {
          borderRadius: 4,
        },
      },
      MuiDivider: {
        root: {
          backgroundColor: '#404854',
        },
      },
      MuiListItemText: {
        primary: {
          fontWeight: theme.typography.fontWeightMedium,
        },
      },
      MuiListItemIcon: {
        root: {
          color: 'inherit',
          marginRight: 0,
          '& svg': {
            fontSize: 20,
          },
        },
      },
      MuiAvatar: {
        root: {
          width: 32,
          height: 32,
        },
      },
      MuiTable: {
      },
      MuiTablecell: {
        root: {
          fontSize: '24px', 
        },
      }, 
    },
    props: {
      MuiTab: {
        disableRipple: true,
      },
    },
    mixins: {
      ...theme.mixins,
      // toolbar: {
      //   minHeight: 48,
      // },
    },
  }
  
export default theme; 