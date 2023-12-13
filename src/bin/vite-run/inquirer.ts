import inquirer from "inquirer";

const prompts = {
  async dev(allowAppList, requireAppList) {
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
          message: () => `请选择要运行的微模块名称[ 默认已选择 ${requireAppList} ]:`,
          name: "widgets",
          when: (res) => res['allow'] === 'select',
          choices: allowAppList,
          default: requireAppList,
        },
      ]
    )
  },
  async build(allowAppList, requireAppList) {
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
          message: () => `请选择要运行的微模块名称[ 默认已选择 ${requireAppList} ]:`,
          name: "widgets",
          when: (res) => res['allow'] === 'select',
          choices: allowAppList,
          default: requireAppList,
        },
      ])
  },
  async preview(allowAppList, requireAppList) {
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
          message: () => `请选择要运行的微模块名称[ 默认已选择 ${requireAppList} ]:`,
          name: "widgets",
          when: (res) => res['allow'] === 'select',
          choices: allowAppList,
          default: requireAppList,
        },
      ]
    )
  }
}
export default prompts
