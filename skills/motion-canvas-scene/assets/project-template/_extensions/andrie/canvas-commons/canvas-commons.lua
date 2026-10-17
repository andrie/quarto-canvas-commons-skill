-- Embeds an animation built with Canvas Commons in a Quarto deck.
--
--   {{< canvas-commons ./animations/src/scene.js fullscreen=true loop=false >}}
--
-- The first argument is the built scene. Options:
--   fullscreen=true   fill the slide
--   width=50%         width of the player (ignored with fullscreen)
--   loop=false        stop on the last frame instead of looping
--   auto=false        do not start the animation when its slide is shown
--   background=true   put the animation behind the slide's content
--
-- `motion-canvas` is accepted as an alias for decks written before the rename.

local VERSION = "0.4.0"

local player_style = [[
<style>
    canvas-commons-player { width:  75%; }
</style>
]]

-- How far this page sits from the project root ("../" for a page in a subdirectory of a website), so the
-- player can find the project's dist/ folder.
local function offset_meta()
  local offset = (quarto.project and quarto.project.offset) or ""
  if offset == "" then
    offset = "./"
  elseif not offset:match("/$") then
    offset = offset .. "/"
  end
  return '<meta name="canvas-commons:offset" content="' .. offset .. '">\n'
end

local stringify = pandoc.utils.stringify

local function escape_attribute(value)
  return (value:gsub("&", "&amp;"):gsub('"', "&quot;"):gsub("<", "&lt;"))
end

local meta_added = false

local function canvas_commons(args, kwargs)
  if not meta_added then
    meta_added = true
    quarto.doc.include_text("in-header", offset_meta())
  end
  quarto.doc.add_html_dependency({
    name = "canvas-commons",
    version = VERSION,
    scripts = { "canvas-commons-bundle.js", "canvas-commons-slides.js" },
    head = player_style,
  })

  local src = stringify(args[1])

  -- Bare words after the scene path (`fullscreen`) mean `fullscreen=true`
  local options = {}
  for i = 2, #args do
    options[stringify(args[i])] = "true"
  end
  for key, value in pairs(kwargs) do
    options[key] = string.gsub(stringify(value), '^"(.*)"$', "%1")
  end

  local style = {}
  if options["fullscreen"] == "true" then
    table.insert(style, "position:absolute; top:0; width:100%;")
  elseif (options["width"] or "") ~= "" then
    table.insert(style, "width:" .. options["width"] .. ";")
  end
  if options["background"] == "true" then
    table.insert(style, "z-index:-1;")
  end

  local attributes = { 'src="' .. escape_attribute(src) .. '"' }
  if options["auto"] == "true" or options["auto"] == "false" then
    table.insert(attributes, 'auto="' .. options["auto"] .. '"')
  end
  if options["loop"] == "false" then
    table.insert(attributes, 'loop="false"')
  end
  if #style > 0 then
    table.insert(attributes, 'style="' .. table.concat(style, " ") .. '"')
  end

  return pandoc.RawInline(
    "html",
    "<canvas-commons-player " .. table.concat(attributes, " ") .. "></canvas-commons-player>"
  )
end

local warned = false

return {
  ["canvas-commons"] = canvas_commons,
  ["motion-canvas"] = function(args, kwargs)
    if not warned then
      warned = true
      quarto.log.warning("The {{< motion-canvas >}} shortcode is now {{< canvas-commons >}}. The old name still works.")
    end
    return canvas_commons(args, kwargs)
  end,
}
