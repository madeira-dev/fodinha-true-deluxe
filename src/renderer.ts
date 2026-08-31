import './index.css';
import { startApp } from './ui/app';

const root = document.getElementById('app');
if (!root) {
  throw new Error('Missing #app root');
}
startApp(root);
