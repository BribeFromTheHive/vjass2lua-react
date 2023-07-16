import 'react';
import ConfigComponent from './Components/configurables/config';
import TextAreaComponent from './Components/textarea/TextArea';
import TopButtonsComponent from './Components/top-buttons/Buttons';
import FooterComponent from './Components/footer/FooterComponent.tsx';
import { ConfigContext, useConfigState } from './ConfigContext.ts';

const App = () => {
    const configValue = useConfigState();
    return (
        <div className="app">
            <ConfigContext.Provider value={configValue}>
                <div className="app-content">
                    <TopButtonsComponent />
                    <div className="editor-config-area">
                        <TextAreaComponent />
                        <ConfigComponent />
                    </div>
                </div>
            </ConfigContext.Provider>
            <FooterComponent />
        </div>
    );
};

export default App;
