<?php
/*
Plugin Name: Popular Posts for Divi -Addon
Plugin URI:  https://trustyplugins.com
Description: A popular posts analytics plugin for Divi Module
Version:     1.0.0
Author:      Trusty Plugins
Author URI:  https://trustyplugins.net
License:     GPL2
License URI: https://www.gnu.org/licenses/gpl-2.0.html
Text Domain: tp-divi-popular-posts
Domain Path: /languages

Divi Popular Posts For Divi is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 2 of the License, or
any later version.

You should have received a copy of the GNU General Public License
along with Timeline Module For Divi. If not, see https://www.gnu.org/licenses/gpl-2.0.html.
 */

 add_action( 'admin_enqueue_scripts', 'jobplace_admin_enqueue_scripts' );

/**
 * Enqueue scripts and styles.
 *
 * @return void
 */
function jobplace_admin_enqueue_scripts() {
    wp_enqueue_script(
        'tp-analytics-react',
        plugin_dir_url( __FILE__ ) . 'react/dist/index.js',
        ['react', 'react-dom'], // Ensure React and ReactDOM are loaded before
        null,
        true // Load in the footer
    );
}



