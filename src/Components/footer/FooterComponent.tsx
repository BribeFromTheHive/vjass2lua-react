import React, { useState } from 'react';
import Intro from './tabs/Intro';
import Reqs from './tabs/Reqs';
import Optional from './tabs/Optional';
import FAQs from './tabs/FAQs';
import Examples from './tabs/Examples.tsx';
import './footer.css';

const FooterComponent = () => {
    const tabs = {
        intro: { title: 'Introduction', component: Intro },
        reqs: { title: 'Requirements', component: Reqs },
        opt: { title: 'Optional', component: Optional },
        faq: { title: 'FAQs', component: FAQs },
        examples: { title: 'Examples', component: Examples },
    };

    type TabId = keyof typeof tabs;

    const [selectedTab, setSelectedTab] = useState<TabId>('intro');

    return (
        <div className={'footer'}>
            <div className={'tab-buttons'}>
                {Object.entries(tabs).map(([id, { title }]) => (
                    <button
                        key={id}
                        onClick={() => setSelectedTab(id as TabId)}
                    >
                        {title}
                    </button>
                ))}
            </div>
            {React.createElement(tabs[selectedTab].component)}
        </div>
    );
};

export default FooterComponent;
