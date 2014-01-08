require "json"
 
module Jekyll
    module JsonFilter
        def json(input)
            input.to_json
        end
    end
end

Liquid::Template.register_filter(Jekyll::JsonFilter)
