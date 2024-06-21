export default ({
  onClick,
  children,
  style = {},
  classes = "",
  active = false,
}) => (
  <a
    className={`py-[4px] px-[6px] ${
      active
        ? "bg-green-500 text-black"
        : "cursor-pointer select-none text-green-500 hover:bg-green-400 hover:text-black hover:underline hover:underline-offset-2"
    } ${classes}`}
    style={style}
    onClick={onClick}
  >
    {children}
  </a>
);
