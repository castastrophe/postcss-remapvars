/*
Copyright 2023 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

/** @type import('postcss').PluginCreator */
module.exports = () => {
  return {
    postcssPlugin: 'postcss-remapvars',
    prepare() {
      // Gather all variables
      const allVariables = [];
      return {
        Declaration(decl) {
          // Check for vars
          if (decl.prop.startsWith('--')) allVariables.push(decl.prop);
        },
        AtRule(atRule, { Declaration }) {
          // Remap variables where requested
          if (atRule.name !== 'remapvars') return;

          const rule = atRule.parent?.type === 'rule' ? atRule.parent : undefined;
          if (!rule) return;

          // Read in config
          const config = atRule.nodes.reduce((config, node) => {
            if (node.type !== 'decl') return config;

            function getPattern(pattern) {
              const match = pattern.match(/^\/(.*?)\/(.*?)$/, '');
              if (!match) return pattern;

              const [, stringPattern, flags] = match;
              return RegExp(stringPattern, flags);
            }

            // Support regexp
            if (node.prop === 'find') config.find = getPattern(node.value);
            else if (node.prop === 'filter') {
              // Support multiple filters split by commas with whitespace
              config.filter = node.value.split(',')?.map((filterPattern) => getPattern(filterPattern.trim())) || [];
            }
            else config[node.prop] = node.value;
            return config;
          }, {});

          // Check for matching variables
          for (let varName of allVariables) {
            if (config.find && !varName.match(config.find)) continue;
            if (config.filter && config.filter.some((pattern) => varName.match(pattern) !== null)) {
              continue;
            }

            // Remap in output
            const decl = new Declaration({
              prop: varName.replace(config.find, config.replace),
              value: `var(${varName})`
            });

            decl.raws.before = atRule.raws.before;
            decl.raws.semicolon = true;

            rule.insertBefore(atRule, decl);
          }

          // Close out the rule with a semicolon
          rule.raws.semicolon = true;

          // Drop the original rule
          atRule.remove();
        },
      };
    },
  };
};

module.exports.postcss = true;
