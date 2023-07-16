const FAQs = () => (
    <ol>
        <li>
            <strong>
                Q: Can I use this tool to convert all of my map's triggers
                simultaneously?
            </strong>
            <br />
            A: While you can convert any length of code at once, this tool has
            not been extensively tested for converting the entire text of a .wtg
            file. It is recommended to convert individual triggers or smaller
            groups of triggers for better reliability.
        </li>
        <li>
            <strong>Q: How can I convert the language in my map to Lua?</strong>
            <br />
            A: To convert your map's language to Lua, you need to follow these
            steps:
            <ol>
                <li>
                    Convert the vJass code in your map's triggers to Lua using
                    this tool.
                </li>
                <li>
                    Replace the original vJass code in your triggers with the
                    generated Lua code.
                </li>
                <li>
                    Ensure that all required Lua dependencies, such as the
                    vJass2Lua Runtime Plugin and Total Initialization, are
                    properly included in your map.
                </li>
                <li>
                    Test your map thoroughly to ensure that the converted code
                    works as expected.
                </li>
            </ol>
        </li>
    </ol>
);

export default FAQs;
