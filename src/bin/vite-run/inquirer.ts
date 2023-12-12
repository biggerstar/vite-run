import inquirer from "inquirer";

const prompts = {
  async dev(allowAppList) {
    return inquirer['prompt'](
      [
        {
          type: 'list',
          message: '请选择您要运行的微模块',
          name: 'allow',
          choices: [
            'select',
            'all',
            'cancel',
          ],
        },
        {
          type: "checkbox",
          message: "请选择要运行的微模块名称(多选):",
          name: "widgets",
          when: (res) => res['allow'] === 'select',
          choices: allowAppList,
          validate: (input) => input.length > 0
        },
      ]
    )
  },
  async build(allowAppList) {
    return inquirer['prompt'](
      [
        {
          type: 'list',
          message: '是否确定要编译所有微模块？',
          name: 'allow',
          choices: [
            'select',
            'all',
            'cancel',
          ],
        },
        {
          type: "checkbox",
          message: "请选择要编译的微模块名称(多选):",
          name: "widgets",
          when: (res) => res['allow'] === 'select',
          choices: allowAppList,
          validate: (input) => input.length > 0
        },
      ])
  },
  async preview(allowAppList) {
    return inquirer['prompt'](
      [
        {
          type: 'list',
          message: '请选择您要进行预览的微模块',
          name: 'allow',
          choices: [
            'select',
            'all',
            'cancel',
          ],
        },
        {
          type: "checkbox",
          message: "请选择要预览的微模块名称(多选):",
          name: "widgets",
          when: (res) => res['allow'] === 'select',
          choices: allowAppList,
          validate: (input) => input.length > 0
        },
      ]
    )
  }
}
export default prompts
