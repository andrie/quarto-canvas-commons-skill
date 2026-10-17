# Build rules for a Quarto deck with Canvas Commons animations.
# Run `make install` once, then `make preview` to work on the deck.

# The deck to render, and the port `make preview` serves it on
QMD_FILE = deck.qmd
PORT = 4200

# >>> canvas-commons 0.4.0 (managed block: the motion-canvas-skill upgrade replaces everything up to the closing marker, so keep your own rules outside it)
# Source files. find -L follows the optional animations/src/lib symlink.
ANIM_SOURCES := $(shell find -L animations/src -name "*.ts" -o -name "*.tsx" -o -name "*.js" 2>/dev/null)

# Empty file whose timestamp records the last successful build
ANIM_BUILD_MARKER := dist/animations/.build-complete

.PHONY: all install anim force-build serve quarto preview publish clean

# Build, render and publish the deck
all: anim quarto publish

# Install the npm dependencies of the scenes. Run once, and after changing animations/package.json
install:
	npm --prefix ./animations install

# Build the scenes, skipping the build when nothing changed. The player bundle ships inside the extension.
anim: $(ANIM_BUILD_MARKER)

# The scenes: type-check with tsc, then bundle each into dist/animations/src/
$(ANIM_BUILD_MARKER): $(ANIM_SOURCES) animations/package.json animations/vite.config.ts
	@echo "Building animations..."
	npm --prefix ./animations run build
	@mkdir -p dist/animations
	@touch $(ANIM_BUILD_MARKER)

# Rebuild everything, ignoring timestamps
force-build:
	@rm -f $(ANIM_BUILD_MARKER)
	$(MAKE) anim

# Start the Vite dev server (http://localhost:9000) with the scene editor and hot reload, for authoring scenes
serve:
	npm --prefix ./animations run serve

# Build, then render the deck to HTML
quarto: anim
	quarto render $(QMD_FILE)

# Build, then serve the deck with live reload on PORT (no browser opened)
preview: anim
	quarto preview $(QMD_FILE) --no-browser --port $(PORT)

# Build, render, then publish the deck with quarto publish
publish: anim
	quarto render $(QMD_FILE)
	quarto publish $(QMD_FILE) --no-prompt

# Delete dist/, which forces a full rebuild next time
clean:
	rm -rf dist
	@echo "Cleaned build outputs and markers"
# <<< canvas-commons
