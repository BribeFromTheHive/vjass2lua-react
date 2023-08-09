import 'react';
import ConfigComponent from './Components/configurables/config';
import TextAreaComponent from './Components/textarea/TextArea';
import TopButtonsComponent from './Components/top-buttons/Buttons';
import FooterComponent from './Components/footer/FooterComponent.tsx';
import { ConfigContext, useConfigState } from './ConfigContext.ts';
import './App.css';

const App = () => {
    const configValue = useConfigState();
    return (
        <div className="app">
            <ConfigContext.Provider value={configValue}>
                <TopButtonsComponent />
                <div className="text-and-config">
                    <TextAreaComponent />
                    <ConfigComponent />
                </div>
            </ConfigContext.Provider>
            <FooterComponent />
        </div>
    );
};

export default App;
