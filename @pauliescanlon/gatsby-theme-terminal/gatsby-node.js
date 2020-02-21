const { createFilePath } = require('gatsby-source-filesystem')
const path = require('path')

// String used to differenciate between .mdx sources from pages and .mdx souced from "source"
const OWNER_NAME = 'source'

exports.onCreateNode = ({ node, actions, getNode }, themeOptions) => {
  const { source } = themeOptions
  const { createNodeField } = actions

  if (node.internal.type === 'Mdx' && !node.internal.fieldOwners) {
    let path = source
    const value = createFilePath({ node, getNode })

    if (Array.isArray(source)) {
      path = node.fileAbsolutePath
        .split('/')
        .filter(str => source.includes(str))
        .toString()
    }
    createNodeField({
      node,
      name: `slug`,
      value: `/${path}${value}`,
    })
    // a owner and parent node fields to the .mdx sourced from "source"
    createNodeField({
      node,
      name: `owner`,
      value: OWNER_NAME,
    })
    // used as a back link to URL, path is the "source" name
    createNodeField({
      node,
      name: `parent`,
      value: path,
    })
  }
}

exports.createPages = async ({ graphql, actions, reporter }) => {
  const { createPage } = actions

  const result = await graphql(`
    query {
      allMdx(
        filter: {
          frontmatter: {
            title: { ne: "dummy" }
            navigationLabel: { ne: "dummy" }
          }
          fields: { owner: { eq: "source" } }
        }
      ) {
        edges {
          previous {
            frontmatter {
              title
            }
            fields {
              slug
            }
          }
          next {
            frontmatter {
              title
            }
            fields {
              slug
            }
          }
          node {
            id
            frontmatter {
              title
              navigationLabel
            }
            fields {
              slug
              owner
              parent
            }
          }
        }
      }
    }
  `)

  if (result.errors) {
    reporter.panicOnBuild('🚨  ERROR: Loading "createPages" query')
  }

  const data = result.data.allMdx.edges

  data.forEach(({ node, previous, next }, index) => {
    createPage({
      path: node.fields.slug,
      component: path.join(__dirname, `src/layouts/SourceLayout.js`),
      context: {
        id: node.id,
        prev: index === 0 ? null : previous,
        next: index === data.length - 1 ? null : next,
        // used a back link in SourceLayout
        parent: node.fields.parent,
      },
    })
  })
}