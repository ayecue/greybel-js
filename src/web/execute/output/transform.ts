import {
  Tag,
  TagRecordOpen,
  transform as textMeshTransform
} from 'text-mesh-transformer';

type Style = {
  label: string;
  value: string;
};
type StyleValueProviderRenderCallback = (value: string, unit: string) => Style;
type StyleValueFactory = (input: string) => Style;

function styleValueProvider(
  render: StyleValueProviderRenderCallback,
  units: string[],
  defaultUnit: string = '',
  defaultValue: string = ''
): StyleValueFactory {
  const item = new RegExp(
    `^([+-]?\\d+(?:\\.\\d+)?)(${units.join('|')})?$`,
    'i'
  );

  return (input: string) => {
    const result = item.exec(input);

    if (!result || result.length === 0) {
      return render(defaultValue, defaultUnit);
    }

    const [_, value, unit] = result;

    if (!unit) {
      return render(value, defaultUnit);
    }

    return render(value, unit);
  };
}

const styleMap: Partial<Record<Tag, Record<string, StyleValueFactory>>> = {
  [Tag.Space]: {
    value: styleValueProvider(
      (value, unit) => {
        return {
          label: 'margin-left',
          value: `${value}${unit}`
        };
      },
      ['px', 'em', '%'],
      'px',
      '0'
    )
  },
  [Tag.MSpace]: {
    value: styleValueProvider(
      (value, unit) => {
        return {
          label: 'word-spacing',
          value: `${value}${unit}`
        };
      },
      ['px', 'em', '%'],
      'px',
      '5'
    )
  },
  [Tag.Scale]: {
    value: styleValueProvider(
      (value, unit) => {
        return {
          label: 'transform',
          value: `scale(${value}${unit})`
        };
      },
      ['px', 'em', '%', 'vw'],
      'vw',
      '1'
    )
  },
  [Tag.Color]: {
    value: (input: string) => {
      return {
        label: 'color',
        value: input
      };
    }
  },
  [Tag.Mark]: {
    value: (input: string) => {
      return {
        label: 'background-color',
        value: input
      };
    }
  },
  [Tag.Sprite]: {
    color: (input: string) => {
      return {
        label: 'background-color',
        value: input
      };
    }
  },
  [Tag.Align]: {
    value: (input: string) => {
      return {
        label: 'text-align',
        value: input
      };
    }
  },
  [Tag.CSpace]: {
    value: styleValueProvider(
      (value, unit) => {
        return {
          label: 'letter-spacing',
          value: `${value}${unit}`
        };
      },
      ['px', 'em', '%'],
      'px',
      '5'
    )
  },
  [Tag.LineHeight]: {
    value: styleValueProvider(
      (value, unit) => {
        return {
          label: 'line-height',
          value: `${value}${unit}`
        };
      },
      ['px', 'em', '%'],
      'px',
      '12'
    )
  },
  [Tag.Margin]: {
    value: styleValueProvider(
      (value, unit) => {
        return {
          label: 'margin',
          value: `0 ${value}${unit}`
        };
      },
      ['px', 'em', '%'],
      'px',
      '0'
    )
  },
  [Tag.Pos]: {
    value: styleValueProvider(
      (value, unit) => {
        return {
          label: 'transform',
          value: `translateX(${value}${unit})`
        };
      },
      ['px', 'em', '%'],
      '%',
      '0'
    )
  },
  [Tag.Size]: {
    value: styleValueProvider(
      (value, unit) => {
        return {
          label: 'font-size',
          value: `${value}${unit}`
        };
      },
      ['px', 'em', '%'],
      'px',
      '1'
    )
  },
  [Tag.VOffset]: {
    value: styleValueProvider(
      (value, unit) => {
        return {
          label: 'vertical-align',
          value: `${value}${unit}`
        };
      },
      ['px', 'em', '%', 'vw'],
      'px',
      '0'
    )
  },
  [Tag.Indent]: {
    value: styleValueProvider(
      (value, unit) => {
        return {
          label: 'margin-left',
          value: `${value}${unit}`
        };
      },
      ['px', 'em', '%'],
      'px',
      '0'
    )
  },
  [Tag.Rotate]: {
    value: styleValueProvider(
      (value, unit) => {
        return {
          label: 'rotate',
          value: `${value}${unit}`
        };
      },
      ['deg'],
      'deg',
      '0'
    )
  }
};

const hasOwnProperty = Object.prototype.hasOwnProperty;

function getStyle(tag: TagRecordOpen) {
  const styleFactories = styleMap[tag.type];

  if (styleFactories && tag.attributes) {
    const styles = [];

    for (const [key, value] of Object.entries(tag.attributes)) {
      if (hasOwnProperty.call(styleFactories, key)) {
        const v = styleFactories[key](value);

        if (v == null) {
          continue;
        }

        styles.push(`${v.label}:${v.value};`);
      }
    }

    return styles.join('');
  }

  return '';
}

function wrapWithTag(openTag, content) {
  switch (openTag.type) {
    case Tag.Space:
      return `<span class="space" style="${getStyle(
        openTag
      )}">${content}</span>`;
    case Tag.MSpace:
      return `<span class="msspace" style="${getStyle(
        openTag
      )}">${content}</span>`;
    case Tag.Color:
      return `<span class="color" style="${getStyle(
        openTag
      )}">${content}</span>`;
    case Tag.Underline:
      return `<span class="underline">${content}</span>`;
    case Tag.Italic:
      return `<span class="italic">${content}</span>`;
    case Tag.Bold:
      return `<span class="bold">${content}</span>`;
    case Tag.Strikethrough:
      return `<span class="strikethrough">${content}</span>`;
    case Tag.Mark:
      return `<span class="mark" style="${getStyle(
        openTag
      )}">${content}</span>`;
    case Tag.Lowercase:
      return `<span class="lowercase">${content}</span>`;
    case Tag.Uppercase:
      return `<span class="uppercase">${content}</span>`;
    case Tag.Align:
      return `<span class="align" style="${getStyle(
        openTag
      )}">${content}</span>`;
    case Tag.CSpace:
      return `<span class="cspace" style="${getStyle(
        openTag
      )}">${content}</span>`;
    case Tag.LineHeight:
      return `<span class="lineheight" style="${getStyle(
        openTag
      )}">${content}</span>`;
    case Tag.Margin:
      return `<span class="margin" style="${getStyle(
        openTag
      )}">${content}</span>`;
    case Tag.NoBR:
      return `<nobr>${content}</nobr>`;
    case Tag.Sprite:
      return `<span class="sprite" style="${getStyle(openTag)}">X</span>`;
    case Tag.Pos:
      return `<span class="pos" style="${getStyle(openTag)}">${content}</span>`;
    case Tag.Size:
      return `<span class="size" style="${getStyle(
        openTag
      )}">${content}</span>`;
    case Tag.Scale:
      return `<span class="scale" style="${getStyle(
        openTag
      )}">${content}</span>`;
    case Tag.VOffset:
      return `<span class="voffset" style="${getStyle(
        openTag
      )}">${content}</span>`;
    case Tag.Indent:
      return `<span class="indent" style="${getStyle(
        openTag
      )}">${content}</span>`;
    case Tag.Rotate:
      return `<span class="rotate" style="${getStyle(
        openTag
      )}">${content}</span>`;
  }

  if (openTag.attributes.value) {
    return `&lt${openTag.type}&#61;${openTag.attributes.value}&gt;${content}&lt/${openTag.type}&gt;`;
  }

  return `&lt${openTag.type}&gt;${content}&lt/${openTag.type}&gt;`;
}

export function transform(text: string): string {
  return textMeshTransform(
    text,
    (openTag: TagRecordOpen, content: string): string => {
      return wrapWithTag(openTag, content);
    }
  );
}
