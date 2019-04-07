import React, { Component } from 'react';
import TimeSelect from './components/TimeSelect'
import 'antd/dist/antd.css';  // ant基础样式
import './App.css';

class App extends Component {
  render() {
    return (
      <div className="App">
        <TimeSelect/>
      </div>
    );
  }
}

export default App;
