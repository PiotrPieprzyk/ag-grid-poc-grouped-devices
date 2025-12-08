import { createApp } from 'vue';
import App from './App.vue';

// Import AG Grid styles
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';

// Set AG Grid Enterprise license (if you have one)
// import { LicenseManager } from 'ag-grid-enterprise';
// LicenseManager.setLicenseKey('YOUR_LICENSE_KEY');

createApp(App).mount('#app');
