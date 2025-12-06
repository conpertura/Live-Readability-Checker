<?php
/**
 * @package Live Readability Checker for TinyMCE WordPress Editor
 * @version 1.0
 */
/*
Plugin Name: Live Readability Checker for TinyMCE WordPress Editor
Plugin URI:
Description: This plugin introduces a live visible representation of "too long" sentences and "too long" sections to improve readability of blog posts and pages, which provides SEO for any Wordpress page. Very useful in combination with other SEO plugins, e. g. Yoast SEO.
Author: conpertura
Version: 1.0
Author URI: github
*/

// Tell WordPress of plugin's existence
function register_plugin( $plugin_array ) {
   $plugin_array['tinymce-live-readability-checker'] = plugins_url( '/plugin.js', __FILE__ );
   return $plugin_array;
}
// Load the TinyMCE plugin
add_filter( 'mce_external_plugins', 'register_plugin' );
 
?>
