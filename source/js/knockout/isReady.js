TouchUI.prototype.knockout.isReady = function(touchViewModel, viewModels) {
	var self = this;

	if(self.isActive()) {
		// Repaint graph after resize (.e.g orientation changed)
		$(window).on("resize", function() {
			viewModels.temperatureViewModel.updatePlot();
		});

		// Remove slimScroll from files list
		$('.gcode_files').slimScroll({destroy: true});
		$('.slimScrollDiv').slimScroll({destroy: true});

		// Remove active keyboard when disabled
		touchViewModel.isKeyboardActive.subscribe(function(isActive) {
			if( !isActive ) {
				$(".ui-keyboard-input").each(function(ind, elm) {
					$(elm).data("keyboard").destroy();
				});
			}
		});

		// Remove drag files into website feature
		$(document).off("dragover");
		if(viewModels.gcodeFilesViewModel._enableDragNDrop) {
			viewModels.gcodeFilesViewModel._enableDragNDrop = function() {};
		}

		// Hide the dropdown after login
		viewModels.settingsViewModel.loginState.loggedIn.subscribe(function(isLoggedIn) {
			if(isLoggedIn && $(".open > .dropdown-menu").length > 0) {
				$(document).trigger("click");
			}
		});

		// Redo scroll-to-end interface
		$("#term .terminal small.pull-right").html('<a href="#"><i class="fa fa-angle-double-down"></i></a>').on("click", function() {
			viewModels.terminalViewModel.scrollToEnd();
			return false;
		});

		// Resize height of low-fi terminal to enable scrolling
		if($("#terminal-output-lowfi").prop("scrollHeight")) {
			viewModels.terminalViewModel.plainLogOutput.subscribe(function() {
				$("#terminal-output-lowfi").height($("#terminal-output-lowfi").prop("scrollHeight"));
			});
		}

		// Overwrite terminal knockout functions (i.e. scroll to end)
		this.scroll.overwrite.call(this, viewModels.terminalViewModel);

		// Setup version tracking in terminal
		this.core.version.init.call(this, viewModels.softwareUpdateViewModel);

		// (Re-)Apply bindings to the new webcam div
		if($("#webcam").length) {
			ko.applyBindings(viewModels.controlViewModel, $("#webcam")[0]);
		}

		// (Re-)Apply bindings to the new navigation div
		if($("#navbar_login").length) {
			try {
				ko.applyBindings(viewModels.navigationViewModel, $("#navbar_login")[0]);
			} catch(err) {}

			// Force the dropdown to appear open when logedIn
			viewModels.navigationViewModel.loginState.loggedIn.subscribe(function(loggedIn) {
				if( loggedIn ) {
					$('#navbar_login a.dropdown-toggle').addClass("hidden_touch");
					$('#login_dropdown_loggedin').removeClass('hide dropdown open').addClass('visible_touch');
				} else {
					$('#navbar_login a.dropdown-toggle').removeClass("hidden_touch");
					$('#login_dropdown_loggedin').removeClass('visible_touch');
				}

				// Refresh scroll view when login state changed
				if( !self.hasTouch ) {
					setTimeout(function() {
						self.scroll.currentActive.refresh();
					}, 0);
				}
			});
		}

		// (Re-)Apply bindings to the new system commands div
		if($("#navbar_systemmenu").length) {
			ko.applyBindings(viewModels.navigationViewModel, $("#navbar_systemmenu")[0]);
			ko.applyBindings(viewModels.navigationViewModel, $("#divider_systemmenu")[0]);
		}

		// Force knockout to read the change
		$('.colorPicker').tinycolorpicker().on("change", function(e, hex, rgb, isTriggered) {
			if(isTriggered !== false) {
				$(this).find("input").trigger("change", [hex, rgb, false]);
			}
		});

		// Reuse for code below
		var refreshUrl = function(href) {
			return href.split("?")[0] + "?ts=" + new Date().getMilliseconds();
		}

		// Reload CSS if needed
		touchViewModel.settings.refreshCSS.subscribe(function(hasRefresh) {
			if (hasRefresh || hasRefresh === "fast") {
				// Wait 2 seconds, so we're not too early
				setTimeout(function() {
					var $css = $("#touchui-css");
					$css.attr("href", refreshUrl($css.attr("href")));
					touchViewModel.settings.refreshCSS(false);
				}, (hasRefresh === "fast") ? 0 : 1200);
			}
		});

		// Reload CSS or LESS after saving our settings
		touchViewModel.settings.hasCustom.subscribe(function(customCSS) {
			if(customCSS !== "") {
				var $css = $("#touchui-css");
				var href = $css.attr("href");

				if(customCSS) {
					href = href.replace("touchui.css", "touchui.custom.css");
				} else {
					href = href.replace("touchui.custom.css", "touchui.css");
				}

				$css.attr("href", refreshUrl(href));
			}
		});
	}

	// Check if we need to update an old LESS file with a new LESS one
	var requireNewCSS = ko.computed(function() {
		return touchViewModel.settings.requireNewCSS() && viewModels.loginStateViewModel.isAdmin();
	});
	requireNewCSS.subscribe(function(requireNewCSS) {
		if(requireNewCSS) {
			setTimeout(function() {
				self.core.less.save.call(self, touchViewModel);
			}, 100);
		}
	});

}
