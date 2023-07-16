const Optional = () => {
    const stringFixer =
        "getmetatable('').__add = function(obj, obj2) return obj .. obj2 end";

    return (
        <>
            <p>
                <a href="https://github.com/BribeFromTheHive/Lua-Core/blob/main/Global%20Variable%20Remapper.lua">
                    Global Variable Remapper
                </a>
                is needed to replicate the functionality of public non-constant
                vJass variables. It allows the service to use non- prefixed
                variable names internally, while allowing read-and-write access
                externally to those who use the prefix.
            </p>
            <hr />
            <p>
                Consider the following alternative to the vJass2Lua Runtime
                Plugin, particularly if you are only converting a vanilla JASS
                script:
            </p>
            <ul>
                <li>
                    Add the following snippet to the top trigger in your map.
                    This can help address any string concatenation issues that
                    might have been missed during the conversion process:
                </li>
            </ul>
            <br />
            <div className="input-group mb-3">
                <input
                    type="text"
                    className="form-control stringmt-input"
                    value={stringFixer}
                    readOnly
                />
                <div className="input-group-append">
                    <button
                        type="button"
                        onClick={() =>
                            navigator.clipboard
                                .writeText(stringFixer)
                                .catch(console.error)
                        }
                        className="btn btn-primary"
                    >
                        Copy
                    </button>
                </div>
            </div>
        </>
    );
};
export default Optional;
