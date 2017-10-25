#!/usr/bin/env bash
# vim:noet:sts=4:ts=4:sw=4:tw=120

#=======================================================================================================================
# (c) 2014 Clemens Lang, neverpanic.de
# See https://neverpanic.de/blog/2014/03/19/downloading-google-web-fonts-for-local-hosting/ for details.
#
# With modifications by
#  - Chris Jung, campino2k.de, and
#  - Robert, github.com/rotx.
#
# Changelog:
#   Version 1.1, 2014-06-21
#     - Remove colons and spaces from file names for Windows compatibility
#     - Add check for Bash version, 4.x is required
#     - Correctly handle fonts without a local PostScript name
#     - Change format('ttf') to format('truetype') in CSS output
#     - Add license header and comments
#     - Added sed extended regex flag detection
#   Version 1.0, 2014-03-19
#
# License:
#   Copyright (c) 2014, Clemens Lang
#   All rights reserved.
#
#   Redistribution and use in source and binary forms, with or without modification, are permitted provided that the
#   following conditions are met:
#
#   1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following
#      disclaimer.
#
#   2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the
#      following disclaimer in the documentation and/or other materials provided with the distribution.
#
#   THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES,
#   INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
#   DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
#   SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
#   SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
#   WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
#   OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
#=======================================================================================================================

#=======================================================================================================================
# Place this script in the directory where you want the font files to be downloaded and a font.css file using the fonts
# to be created. Adjust the list of fonts in the $families variable below with the names of the Google fonts you want to
# use. If you like, you can adjust the $css variable to write the generated CSS to a different file. Not that this file
# will be created and overwritten if it exists.
#=======================================================================================================================

declare -a families
families+=('Open+Sans:400')
families+=('Open+Sans:600')

# Adjust this is you want the created file to have a different name. Note that this file will be overwritten!
css="font.css"
url="http://fonts.googleapis.com/css?family=Open+Sans:400,600"

#=======================================================================================================================
# No user-serviceable parts below this line. If you just want to use this script, you can stop reading here.
#
# If you made modifications you'd like to see merged into this script, please mail me a patch to 'cl' at 'clang' dot
# 'name' or leave a comment at https://neverpanic.de/blog/2014/03/19/downloading-google-web-fonts-for-local-hosting/.
#=======================================================================================================================

# Ensure the bash version is new enough. If it isn't error out with a helpful error message rather than crashing later.
# if [ ${BASH_VERSINFO[0]} -lt 4 ]; then
#   echo "Error: This script needs Bash 4.x to run." >&2
#   exit 1
# fi

# Check whether sed is GNU or BSD sed, or rather, which parameter enables extended regex support. Note that GNU sed does
# have -E as an undocumented compatibility option on some systems.
if [ "$(echo "test" | sed -E 's/([st]+)$/xx\1/' 2>/dev/null)" == "texxst" ]; then
  ESED="sed -E"
elif [ "$(echo "test" | sed -r 's/([st]+)$/xx\1/' 2>/dev/null)" == "texxst" ]; then
  ESED="sed -r"
else
  echo "Error: $(which sed) seems to lack extended regex support with -E or -r." >&2
  exit 2
fi

# Store the useragents we're going to use to trick Google's servers into serving us the correct CSS file.
declare -A useragent
useragent[eot]='Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0)'
useragent[woff]='Mozilla/5.0 (Windows NT 6.1; WOW64; rv:27.0) Gecko/20100101 Firefox/27.0'
useragent[svg]='Mozilla/4.0 (iPad; CPU OS 4_0_1 like Mac OS X) AppleWebKit/534.46 (KHTML, like Gecko) Version/4.1 Mobile/9A405 Safari/7534.48.3'
useragent[ttf]='Mozilla/5.0 (Windows NT 6.1) AppleWebKit/534.54.16 (KHTML, like Gecko) Version/5.1.4 Safari/534.54.16'

# Clear the output file
>"$css"

# Loop over the fonts, and download them one-by-one
for family in "${families[@]}"; do
  echo -n "Downloading ${family}... "
  printf "@font-face {\n" >>"$css"

  # Extract name, Windows-safe filename, font style and font weight from the font family name
  fontname=$(echo "$family" | awk -F : '{print $1}')
  fontnameescaped=$(echo "$family" | $ESED 's/( |:)/_/g')
  fontstyle=$(echo "$family" | awk -F : '{print $2}')
  fontweight=$(echo "$fontstyle" | $ESED 's/italic$//g')

  printf "\tfont-family: '%s';\n" "$fontname" >>"$css"

  # $fontstyle could be bolditalic, bold, italic, normal, or nothing.
  case "$fontstyle" in
      *italic)
          printf "\tfont-style: italic;\n" >>"$css"
          ;;
      *)
          printf "\tfont-style: normal;\n" >>"$css"
          ;;
  esac

  # Either bold, a number, or empty. If empty, default to "normal".
  printf "\tfont-weight: %s;\n" "${fontweight:-normal}" >>"$css"

  printf "\tsrc:\n" >>"$css"

  # Determine the local names for the given fonts so we can use a locally-installed font if available.
  local_name=$(curl -sf --get --data-urlencode "family=$family" "$url" | grep -E "src:" | $ESED "s/^.*src: local\\('([^']+)'\\),.*$/\\1/g")
  local_postscript_name=$(curl -sf --get --data-urlencode "family=$family" "$url" | grep -E "src:" | $ESED "s/^.*, local\\('([^']+)'\\),.*$/\\1/g")

  # Some fonts don't have a local PostScript name.
  printf "\t\tlocal('%s'),\n" "$local_name" >>"$css"
  if [ -n "$local_postscript_name" ]; then
      printf "\t\tlocal('%s'),\n" "$local_postscript_name" >>"$css"
  fi

  # For each font format, download the font file and print the corresponding CSS statements.
  for uakey in eot woff ttf svg; do
      echo -n "$uakey "

      # Download Google's CSS and throw some regex at it to find the font's URL
      if [ "$uakey" != "svg" ]; then
          pattern="http:\\/\\/[^\\)]+\\.$uakey"
      else
          pattern="http:\\/\\/[^\\)]+"
      fi
      file=$(curl -sf -A "${useragent[$uakey]}" --get --data-urlencode "family=$family" "$url" | grep -Eo "$pattern" | sort -u)
      printf "\t\t/* from %s */\n" "$file" >>"$css"
      if [ "$uakey" == "svg" ]; then
          # SVG fonts need the font after a hash symbol, so extract the correct name from Google's CSS
          svgname=$(echo "$file" | $ESED 's/^[^#]+#(.*)$/\1/g')
      fi
      # Actually download the font file
      curl -sfL "$file" -o "${fontnameescaped}.$uakey"

      # Generate the CSS statements required to include the downloaded file.
      case "$uakey" in
          eot)
              printf "\t\turl('%s?#iefix') format('embedded-opentype'),\n" "${fontnameescaped}.$uakey" >>"$css"
              ;;
          woff)
              printf "\t\turl('%s') format('woff'),\n" "${fontnameescaped}.$uakey" >>"$css"
              ;;
          ttf)
              printf "\t\turl('%s') format('truetype'),\n" "${fontnameescaped}.$uakey" >>"$css"
              ;;
          svg)
              printf "\t\turl('%s#%s') format('svg');\n" "${fontnameescaped}.${uakey}" "$svgname" >>"$css"
              ;;
      esac
  done

  printf "}\n" >>"$css"
  echo
done