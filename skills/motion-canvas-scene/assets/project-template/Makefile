QMD_FILE = smoke.qmd
PORT = 4200

# Source file patterns
ANIM_SOURCES := $(shell find animations/src -name "*.ts" -o -name "*.tsx" -o -name "*.js" 2>/dev/null)
ROOT_SOURCES := $(shell find . -maxdepth 1 -name "*.ts" -o -name "*.js" -o -name "package.json" -o -name "vite.config.*" 2>/dev/null)

# Build output markers
ANIM_BUILD_MARKER := dist/animations/.build-complete
ROOT_BUILD_MARKER := dist/.build-complete

# Phony target to prevent file name conflict
.PHONY: all install build anim quarto publish serve preview clean scene force-build

# Default target
all: anim quarto publish

install:
	npm install
	npm --prefix ./animations install

# Target for building animations
scene:
	./node_modules/.bin/vite build

# Build root project only if sources changed
$(ROOT_BUILD_MARKER): $(ROOT_SOURCES)
	@echo "Building root project..."
	npm run build
	@mkdir -p dist
	@touch $(ROOT_BUILD_MARKER)

# Build animations only if sources changed
$(ANIM_BUILD_MARKER): $(ANIM_SOURCES) animations/package.json animations/vite.config.ts
	@echo "Building animations..."
	npm --prefix ./animations run build
	@mkdir -p dist/animations
	@touch $(ANIM_BUILD_MARKER)

# Main build target depends on both build markers
build: $(ROOT_BUILD_MARKER) $(ANIM_BUILD_MARKER)

# Force rebuild (ignores timestamps)
force-build:
	@rm -f $(ROOT_BUILD_MARKER) $(ANIM_BUILD_MARKER)
	$(MAKE) build

anim: build


serve:
	npm --prefix ./animations run serve

quarto: anim
	quarto render $(QMD_FILE)

preview: anim
	quarto preview $(QMD_FILE) --no-browser --port ${PORT}

publish: anim
	quarto render $(QMD_FILE)
	quarto publish $(QMD_FILE) --no-prompt

clean:
	rm -rf dist
	@echo "Cleaned build outputs and markers"

