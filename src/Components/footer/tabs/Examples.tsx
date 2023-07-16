const Examples = () => {
    const vJassExample = `\
library Example initializer Init requires Something
    globals
        private integer exampleInt = 42 
    endglobals
    
    private function Init takes nothing returns nothing
        call BJDebugMsg("Hello, World!")
    endfunction
endlibrary`;

    const luaExample = `\
OnInit('Example', function()
    Require 'Something'
    LIBRARY_Example = true
    local SCOPE_PREFIX = 'Example_' ---@type string 

        local exampleInt         = 42  ---@type integer 
    
    
    local function Init()
        BJDebugMsg("Hello, World!")
    end
    Require('Init vJass Libraries'); Init()
end)`;
    return (
        <div>
            <h5>vJass Example:</h5>

            <pre>
                <code className="language-vjass">{vJassExample}</code>
            </pre>

            <h5>Lua Equivalent:</h5>

            <pre>
                <code className="language-lua">{luaExample}</code>
            </pre>
        </div>
    );
};

export default Examples;
