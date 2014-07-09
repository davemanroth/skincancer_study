<?php
/**
 * Implements theme_menu_tree().
 */
function ask_theme_menu_tree($variables) {
  return '<ul class="menu nav">' . $variables['tree'] . '</ul>';
}

function ask_theme_preprocess_html(&$variables) {
	$filepath = drupal_get_path('theme', 'ask_theme') . '/css/fonts.css';
  if (file_exists($filepath)) {
    drupal_add_css($filepath, array(
      'preprocess' => TRUE,
      'group' => CSS_THEME,
      'media' => 'screen',
      'every_page' => TRUE,
		));
	}
}